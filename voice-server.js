// Voice Server for Twilio Media Streams + ElevenLabs + LLM Integration
// Note: This must be run as a separate Node.js process alongside Next.js 
// (e.g. `node voice-server.js`) because Serverless environments don't support persistent WebSockets.

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.VOICE_PORT || 8080;
const server = http.createServer();
const wss = new WebSocket.Server({ server, path: '/api/voice/stream' });

console.log(`[Voice Server] Starting on port ${PORT}...`);

wss.on('connection', (ws, req) => {
  console.log('[Voice Server] New connection established.');
  
  let streamSid = null;
  
  // Connect to ElevenLabs Conversational AI WebSocket
  // You would set up an agent in ElevenLabs and get its ID
  const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'mock-agent-id';
  
  // In a real implementation, we would bridge the Twilio WebSocket and ElevenLabs WebSocket:
  // const elevenWs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`);

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    
    switch (msg.event) {
      case 'connected':
        console.log('[Twilio] Media Stream Connected');
        break;
      case 'start':
        streamSid = msg.start.streamSid;
        console.log(`[Twilio] Stream started. streamSid: ${streamSid}`);
        
        // Mocking an AI response to the caller
        const aiResponseAudio = Buffer.from('mock_audio_data').toString('base64');
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: aiResponseAudio
          }
        }));
        break;
      case 'media':
        // Incoming audio from the caller
        // Pass this payload to the LLM / Speech-To-Text service
        // elevenWs.send(JSON.stringify({ user_audio: msg.media.payload }));
        break;
      case 'stop':
        console.log('[Twilio] Stream stopped');
        break;
    }
  });

  ws.on('close', () => {
    console.log('[Voice Server] Connection closed');
  });
});

server.listen(PORT, () => {
  console.log(`[Voice Server] Listening on ws://localhost:${PORT}/api/voice/stream`);
});
