const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const apps = [
  {
    id: "google-business",
    name: "Google Business Profile",
    category: "marketing",
    tagline: "Sync reviews and respond to messages directly.",
    description: "Connect your Google Business Profile to Nexlin. Reply to customer reviews and chats directly from the Unified Inbox.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
    installType: "oauth",
    configSchema: JSON.stringify({}),
    badge: "Essential",
    isActive: true,
    sortOrder: 1
  },
  {
    id: "stripe-sync",
    name: "Stripe Sync",
    category: "payments",
    tagline: "Accept payments and manage subscriptions.",
    description: "Deeply integrate Stripe payments and subscriptions into Nexlin CRM. Send invoices via SMS or Email.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    installType: "oauth",
    configSchema: JSON.stringify({}),
    badge: "Popular",
    isActive: true,
    sortOrder: 2
  },
  {
    id: "elevenlabs-voice",
    name: "ElevenLabs Voice Agents",
    category: "ai",
    tagline: "Ultra-realistic AI voice agents.",
    description: "Deploy ultra-realistic AI voice agents for inbound and outbound calling using ElevenLabs models.",
    icon: "https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/ub9k9okg1vofm7r4u6h2",
    installType: "apikey",
    configSchema: JSON.stringify({ apiKey: "string" }),
    badge: "Trending",
    isActive: true,
    sortOrder: 3
  },
  {
    id: "twilio-connect",
    name: "Twilio Connect",
    category: "comms",
    tagline: "Send automated SMS and handle A2P 10DLC.",
    description: "Send automated SMS and handle A2P 10DLC compliance automatically using your own Twilio account.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg",
    installType: "apikey",
    configSchema: JSON.stringify({ accountSid: "string", authToken: "string" }),
    badge: null,
    isActive: true,
    sortOrder: 4
  },
  {
    id: "slack-notifications",
    name: "Slack Notifications",
    category: "comms",
    tagline: "Get CRM alerts in Slack.",
    description: "Receive instant notifications in Slack when a new lead comes in or an appointment is booked.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    installType: "oauth",
    configSchema: JSON.stringify({}),
    badge: null,
    isActive: true,
    sortOrder: 5
  },
  {
    id: "mailchimp-sync",
    name: "Mailchimp Sync",
    category: "marketing",
    tagline: "Two-way contact synchronization.",
    description: "Keep your Mailchimp audiences perfectly in sync with your Nexlin CRM contacts.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/77/Mailchimp_Freddie_Icon.svg",
    installType: "apikey",
    configSchema: JSON.stringify({ apiKey: "string", serverPrefix: "string" }),
    badge: null,
    isActive: true,
    sortOrder: 6
  },
  {
    id: "zoom-meetings",
    name: "Zoom Meetings",
    category: "comms",
    tagline: "Auto-generate Zoom links for appointments.",
    description: "Automatically generate and attach Zoom meeting links when clients book on your calendar.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
    installType: "oauth",
    configSchema: JSON.stringify({}),
    badge: "Essential",
    isActive: true,
    sortOrder: 7
  },
  {
    id: "custom-webhook",
    name: "Custom Webhook",
    category: "developer",
    tagline: "Fire custom HTTP requests.",
    description: "Send custom JSON payloads to any URL when a workflow triggers this action.",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Webhook_icon.svg",
    installType: "webhook",
    configSchema: JSON.stringify({ url: "string", method: "string" }),
    badge: null,
    isActive: true,
    sortOrder: 8
  }
];

async function seed() {
  console.log("Seeding Marketplace Apps...");
  for (const app of apps) {
    await db.app.upsert({
      where: { id: app.id },
      update: app,
      create: app
    });
    console.log(`- Upserted ${app.name}`);
  }
  console.log("Seeding complete.");
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
