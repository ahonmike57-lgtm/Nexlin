import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const workflow = await db.workflow.findFirst();
    return NextResponse.json({ success: true, workflow: workflow?.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
