import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const host = req.headers.get('host') || 'nexlin-virid.vercel.app';
    const wssUrl = `wss://${host}/api/voice/stream`;

    // Return TwiML telling Twilio to Connect the call to our WebSocket stream
    const twiml = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">Connecting you to the Nexlin AI Voice Agent. Please wait.</Say>
  <Connect>
    <Stream url="${wssUrl}">
      <Parameter name="agencyId" value="default" />
    </Stream>
  </Connect>
</Response>
    `.trim();

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error("Voice Incoming Error:", error);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, an error occurred.</Say></Response>`, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
