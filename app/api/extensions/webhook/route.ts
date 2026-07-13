import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * An example webhook receiver that external systems (like an installed Extension)
 * can send events to. E.g. POST /api/extensions/webhook?agencyId=xyz&extensionId=abc
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agencyId = searchParams.get('agencyId')
    const extensionId = searchParams.get('extensionId')

    if (!agencyId || !extensionId) {
      return NextResponse.json({ error: 'Missing agencyId or extensionId parameters' }, { status: 400 })
    }

    // Verify the installation
    const install = await db.extensionInstall.findUnique({
      where: {
        agencyId_extensionId: {
          agencyId,
          extensionId
        }
      }
    });

    if (!install || !install.isActive) {
      return NextResponse.json({ error: 'Extension is not active or not installed' }, { status: 403 })
    }

    const payload = await req.json()

    // 1. Audit log the event
    await db.extensionAuditLog.create({
      data: {
        agencyId,
        action: 'EXTENSION_WEBHOOK_RECEIVED',
        details: JSON.stringify({ extensionId, payload }),
      }
    });

    // 2. Here we would route the payload to internal NEXLIN logic
    // based on the extension manifest (e.g. trigger an automation workflow)

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
