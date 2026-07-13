'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getExtensions(agencyId: string) {
  try {
    // Get global extensions + agency-specific ones
    const availableExtensions = await db.extension.findMany({
      where: {
        OR: [
          { agencyId: null },
          { agencyId }
        ],
        isActive: true
      }
    });

    const installed = await db.extensionInstall.findMany({
      where: { agencyId },
      include: { extension: true }
    });

    return { success: true, availableExtensions, installed };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function installExtension(agencyId: string, extensionId: string, config: any) {
  try {
    // Check if it exists
    const ext = await db.extension.findUnique({ where: { id: extensionId } });
    if (!ext) throw new Error("Extension not found");

    const install = await db.extensionInstall.upsert({
      where: {
        agencyId_extensionId: {
          agencyId,
          extensionId
        }
      },
      update: {
        config: JSON.stringify(config),
        isActive: true
      },
      create: {
        agencyId,
        extensionId,
        config: JSON.stringify(config),
        isActive: true
      }
    });

    await db.extensionAuditLog.create({
      data: {
        agencyId,
        action: 'EXTENSION_INSTALL',
        details: JSON.stringify({ extensionId }),
      }
    });

    revalidatePath('/settings/extensions');
    return { success: true, install };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uninstallExtension(agencyId: string, extensionId: string) {
  try {
    await db.extensionInstall.delete({
      where: {
        agencyId_extensionId: {
          agencyId,
          extensionId
        }
      }
    });

    await db.extensionAuditLog.create({
      data: {
        agencyId,
        action: 'EXTENSION_UNINSTALL',
        details: JSON.stringify({ extensionId }),
      }
    });

    revalidatePath('/settings/extensions');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
