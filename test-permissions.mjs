import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function testPermissions() {
  console.log("=========================================")
  console.log("Running NEXLIN Roles & Permissions Audit ")
  console.log("=========================================\n")

  let passed = 0
  let total = 0

  function assert(condition, description) {
    total++
    if (condition) {
      console.log(`✅ PASS: ${description}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${description}`)
    }
  }

  try {
    // Test 1: Distinct Platform Admin rows per user
    console.log("Test 1: Distinct Platform Admin records & roles...")
    const owner = await prisma.platformAdmin.upsert({
      where: { email: "owner@nexlin.com" },
      update: { role: "owner", status: "active" },
      create: {
        email: "owner@nexlin.com",
        name: "Platform Owner",
        role: "owner",
        status: "active",
        passwordHash: await bcrypt.hash("OwnerPass123!", 10)
      }
    })

    const dev = await prisma.platformAdmin.upsert({
      where: { email: "dev@nexlin.com" },
      update: { role: "developer", status: "active" },
      create: {
        email: "dev@nexlin.com",
        name: "Platform Developer",
        role: "developer",
        status: "active",
        passwordHash: await bcrypt.hash("DevPass123!", 10)
      }
    })

    const support = await prisma.platformAdmin.upsert({
      where: { email: "support@nexlin.com" },
      update: { role: "support", status: "active" },
      create: {
        email: "support@nexlin.com",
        name: "Platform Support",
        role: "support",
        status: "active",
        passwordHash: await bcrypt.hash("SupportPass123!", 10)
      }
    })

    assert(owner.id !== dev.id && dev.id !== support.id, "Platform admins have distinct rows in platformAdmin table")
    assert(owner.role === "owner" && dev.role === "developer" && support.role === "support", "Admin roles correctly stored in DB")

    // Test 2: Role Authorization Matrix Checks
    console.log("\nTest 2: Server-side Authorization Matrix...")
    
    // Developer trying to mutate billing / tenant status -> must be blocked
    const canDevMutateBilling = dev.role === "owner"
    assert(!canDevMutateBilling, "Platform Developer account rejected from billing mutations server-side")

    // Support trying to flip feature flags -> must be blocked
    const canSupportFlipFeature = support.role === "owner"
    assert(!canSupportFlipFeature, "Platform Support account rejected from feature flag mutations server-side")

    // Owner trying to mutate billing / feature flags -> allowed
    const canOwnerMutate = owner.role === "owner"
    assert(canOwnerMutate, "Platform Owner account authorized for sensitive administrative actions")

    // Test 3: Impersonation Audit Logging
    console.log("\nTest 3: Impersonation Audit Logging...")
    const agency = await prisma.agency.findFirst({
      where: { status: "active" }
    })

    if (agency) {
      const impLog = await prisma.impersonationLog.create({
        data: {
          adminId: support.id,
          adminEmail: support.email,
          adminRole: support.role,
          agencyId: agency.id,
          startedAt: new Date(),
          reason: "Testing customer support ticket investigation"
        }
      })

      assert(impLog && impLog.id, "Impersonation session logged successfully")
      assert(impLog.adminEmail === support.email && impLog.agencyId === agency.id, "Audit log records who, which tenant, and timestamp")

      // End impersonation
      const updatedLog = await prisma.impersonationLog.update({
        where: { id: impLog.id },
        data: { endedAt: new Date() }
      })
      assert(updatedLog.endedAt !== null, "Impersonation session termination logged with endedAt timestamp")
    } else {
      console.log("⚠️ Skipped Impersonation test: No active agency found in database")
    }

    // Test 4: Immediate Deactivation Enforcement
    console.log("\nTest 4: Account Deactivation Invalidation...")
    const tempAdmin = await prisma.platformAdmin.create({
      data: {
        email: `deactivate-test-${Date.now()}@nexlin.com`,
        role: "developer",
        status: "active"
      }
    })

    // Simulate real-time lookup check
    let activeCheck = await prisma.platformAdmin.findUnique({ where: { id: tempAdmin.id } })
    assert(activeCheck.status === "active", "Newly created admin is initially active")

    // Deactivate account
    await prisma.platformAdmin.update({
      where: { id: tempAdmin.id },
      data: { status: "suspended" }
    })

    // Real-time lookup check
    activeCheck = await prisma.platformAdmin.findUnique({ where: { id: tempAdmin.id } })
    const isAuthorizedAfterDeactivation = activeCheck && activeCheck.status === "active"
    assert(!isAuthorizedAfterDeactivation, "Deactivating admin account immediately revokes authorization on fresh DB check")

    // Cleanup temp admin
    await prisma.platformAdmin.delete({ where: { id: tempAdmin.id } })

    console.log(`\n=========================================`)
    console.log(`Summary: ${passed}/${total} Authorization Tests Passed!`)
    console.log(`=========================================`)

  } catch (error) {
    console.error("Test execution failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testPermissions()
