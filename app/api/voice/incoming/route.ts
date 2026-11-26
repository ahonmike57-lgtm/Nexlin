import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deliverMessage } from '@/lib/messaging';
import { verifyTwilioWebhookRequest } from '@/lib/webhooks';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const signatureCheck = verifyTwilioWebhookRequest(req, params);
    if (!signatureCheck.valid) {
      return new NextResponse(signatureCheck.error || 'Unauthorized', {
        status: signatureCheck.status || 401,
      });
    }

    const from = (formData.get('From') as string) || '';
    const to = (formData.get('To') as string) || '';
    const callSid = (formData.get('CallSid') as string) || '';

    // Resolve agency by inbound dialed number
    let agency = null;
    if (to) {
      const matchedPhone = await db.phoneNumber.findFirst({
        where: { OR: [{ number: to }, { number: `+${to.replace(/[^0-9]/g, '')}` }] },
        include: { agency: true }
      });
      if (matchedPhone) agency = matchedPhone.agency;
    }

    const agencyName = agency?.name || 'Nexlin Business Solutions';
    const safeAgencyNameXml = escapeXml(agencyName);

    // If missed call text-back is enabled, send instantaneous SMS to caller
    if (from && agency) {
      const voiceAgent = await db.voiceAgent.findFirst({
        where: { agencyId: agency.id, isActive: true }
      });

      if (voiceAgent?.missedCallEnabled) {
        const smsText = voiceAgent.missedCallMessage || `Hi! Sorry we missed your call to ${agencyName}. How can we assist you today?`;
        
        let contact = await db.contact.findFirst({
          where: { agencyId: agency.id, phone: from }
        });

        if (!contact) {
          contact = await db.contact.create({
            data: {
              agencyId: agency.id,
              firstName: 'Inbound',
              lastName: 'Caller',
              phone: from,
              leadScore: 30,
              tags: 'inbound_call'
            }
          });
        }

        // Dispatch instant text-back
        deliverMessage({
          agencyId: agency.id,
          channel: 'sms',
          contact,
          content: smsText
        }).catch(err => console.error('[Voice Incoming] Text-back dispatch error:', err));
      }
    }

    // Return robust TwiML that works reliably across all carrier environments
    const twiml = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling ${safeAgencyNameXml}. Your call has been logged, and our team has dispatched a priority message to your mobile phone. Please leave a brief message after the beep.</Say>
  <Record maxLength="60" finishOnKey="#" playBeep="true" />
  <Say voice="Polly.Joanna">Thank you. Goodbye.</Say>
  <Hangup />
</Response>
    `.trim();

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error("Voice Incoming Error:", error);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling. Your call has been registered. Goodbye.</Say><Hangup /></Response>`, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
