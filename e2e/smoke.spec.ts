import { expect, test } from "@playwright/test"

test.describe("Nexlin public & security smoke suite", () => {
  test("homepage renders with zero uncaught page errors", async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", (err) => pageErrors.push(err.message))

    const response = await page.goto("/")
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator("body")).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test("login and register pages render auth forms", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    await page.goto("/register")
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("blog route loads cleanly", async ({ page }) => {
    const response = await page.goto("/blog")
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator("body")).toBeVisible()
  })

  test("protected dashboard and platform routes redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)

    await page.goto("/platform")
    await expect(page).toHaveURL(/\/login/)
  })

  test("health and og endpoints respond cleanly and protected domain API rejects unauthenticated access", async ({ request }) => {
    const healthRes = await request.get("/api/health")
    expect([200, 503]).toContain(healthRes.status())
    const healthBody = await healthRes.json()
    expect(healthBody).toHaveProperty("status")

    const ogRes = await request.get("/api/og?title=Nexlin")
    expect(ogRes.status()).toBe(200)
    expect(ogRes.headers()["content-type"]).toContain("image/png")

    const domainsRes = await request.get("/api/domains", { maxRedirects: 0 })
    expect([302, 307, 401, 403]).toContain(domainsRes.status())
  })
})
