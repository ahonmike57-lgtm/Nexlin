export const TOP_30_MARKETPLACE_APPS = [
  // Payments & Billing (6)
  {
    id: "stripe-sync",
    name: "Stripe Enterprise Sync",
    category: "Payments",
    tagline: "Process cards, subscriptions & dunning workflows.",
    description: "Deeply integrate Stripe payments, recurring subscriptions, and dunning workflows directly into Nexlin CRM.",
    installType: "oauth",
    badge: "Official",
    sortOrder: 1
  },
  {
    id: "paypal-direct",
    name: "PayPal Commerce",
    category: "Payments",
    tagline: "Accept PayPal & Credit Card checkouts.",
    description: "Seamlessly accept global PayPal payments, subscriptions, and one-click checkouts on funnels.",
    installType: "config",
    badge: "Popular",
    sortOrder: 2
  },
  {
    id: "authorize-net",
    name: "Authorize.Net Gateway",
    category: "Payments",
    tagline: "High-risk & merchant account billing.",
    description: "Connect your custom merchant gateway account for credit card processing and automated invoicing.",
    installType: "apikey",
    sortOrder: 3
  },
  {
    id: "quickbooks-online",
    name: "QuickBooks Online",
    category: "Payments",
    tagline: "Automated accounting & invoice sync.",
    description: "Two-way synchronization passing invoice statuses, tax ledger records, and customer payments to QuickBooks.",
    installType: "oauth",
    badge: "Finance",
    sortOrder: 4
  },
  {
    id: "xero-ledger",
    name: "Xero Accounting Bridge",
    category: "Payments",
    tagline: "Real-time general ledger accounting.",
    description: "Sync sales receipts, contact accounts, and recurring subscription invoices directly to Xero books.",
    installType: "oauth",
    sortOrder: 5
  },
  {
    id: "chargebee-billing",
    name: "Chargebee Recurring SaaS",
    category: "Payments",
    tagline: "Advanced B2B subscription management.",
    description: "Manage complex enterprise subscription tiers, usage-based billing, and credit notes.",
    installType: "apikey",
    sortOrder: 6
  },

  // AI & Voice Automation (7)
  {
    id: "openai-copilot",
    name: "OpenAI Workflow Copilot",
    category: "AI",
    tagline: "GPT-4 powered inbox & workflow actions.",
    description: "Bring GPT-4 intelligence directly into your pipeline automations, email responder, and live chat inbox.",
    installType: "apikey",
    badge: "Featured",
    sortOrder: 7
  },
  {
    id: "elevenlabs-voice",
    name: "ElevenLabs Voice Agents",
    category: "AI",
    tagline: "Ultra-realistic human conversational voice.",
    description: "Deploy hyper-realistic AI voice models for inbound call answering and automated outbound dialer queues.",
    installType: "apikey",
    badge: "Popular",
    sortOrder: 8
  },
  {
    id: "retell-ai",
    name: "Retell AI Phone Reps",
    category: "AI",
    tagline: "Low-latency voice bots for appointment booking.",
    description: "Sub-second voice AI agent integration handling FAQs, phone calls, and calendar bookings.",
    installType: "apikey",
    sortOrder: 9
  },
  {
    id: "vapi-voice",
    name: "Vapi AI Call Assistant",
    category: "AI",
    tagline: "Custom voice pipeline orchestrator.",
    description: "Orchestrate custom telephony voice pipelines with custom LLM backends and tools.",
    installType: "apikey",
    sortOrder: 10
  },
  {
    id: "claude-assistant",
    name: "Anthropic Claude Assistant",
    category: "AI",
    tagline: "Advanced reasoning for complex copy & support.",
    description: "Leverage Claude 3.5 Sonnet for drafting blog articles, landing page copy, and support replies.",
    installType: "apikey",
    sortOrder: 11
  },
  {
    id: "make-sync",
    name: "Make (Integromat) Connector",
    category: "Automation",
    tagline: "Visual scenario automation bridge.",
    description: "Connect Nexlin webhooks to 1,000+ external apps using Make's visual scenario builder.",
    installType: "webhook",
    sortOrder: 12
  },
  {
    id: "zapier-bridge",
    name: "Zapier Integration Hub",
    category: "Automation",
    tagline: "Instant Zaps for 5,000+ web applications.",
    description: "Trigger external Zaps when contacts are created, deals move stages, or forms are submitted.",
    installType: "config",
    badge: "Official",
    sortOrder: 13
  },

  // Communication & Telephony (6)
  {
    id: "twilio-connect",
    name: "Twilio Telephony & A2P",
    category: "Communication",
    tagline: "Native SMS/MMS & A2P 10DLC compliance.",
    description: "Provision local numbers, send automated text messages, and secure A2P 10DLC brand registration.",
    installType: "apikey",
    badge: "Essential",
    sortOrder: 14
  },
  {
    id: "whatsapp-cloud-api",
    name: "Meta WhatsApp Business API",
    category: "Communication",
    tagline: "Native 2-way WhatsApp messaging.",
    description: "Connect your official Meta WhatsApp Business account for two-way chat inbox communication.",
    installType: "oauth",
    badge: "Official",
    sortOrder: 15
  },
  {
    id: "zoom-meetings",
    name: "Zoom Video Meetings",
    category: "Communication",
    tagline: "Auto-generate video links for appointments.",
    description: "Automatically attach unique Zoom meeting URLs to calendar bookings and reminder emails.",
    installType: "oauth",
    sortOrder: 16
  },
  {
    id: "slack-alerts",
    name: "Slack Team Notifications",
    category: "Communication",
    tagline: "Instant internal channel alerts.",
    description: "Post real-time notifications to designated Slack channels when hot leads fill forms or close deals.",
    installType: "oauth",
    sortOrder: 17
  },
  {
    id: "ringcentral-voip",
    name: "RingCentral Cloud VoIP",
    category: "Communication",
    tagline: "Enterprise cloud phone system routing.",
    description: "Route inbound business phone calls and log call records directly inside Nexlin CRM.",
    installType: "oauth",
    sortOrder: 18
  },
  {
    id: "telegram-bot",
    name: "Telegram Community Bot",
    category: "Communication",
    tagline: "Broadcast updates to Telegram groups.",
    description: "Send automated lead notifications and campaign updates straight to Telegram channels.",
    installType: "apikey",
    sortOrder: 19
  },

  // Marketing & Lead Generation (5)
  {
    id: "google-ads-attribution",
    name: "Google Ads Offline Conversions",
    category: "Marketing",
    tagline: "Pass closed CRM revenue back to Google Ads.",
    description: "Send offline deal conversion data back to Google Ads to optimize smart bidding for high-value leads.",
    installType: "oauth",
    badge: "Ads",
    sortOrder: 20
  },
  {
    id: "meta-ads-leadgen",
    name: "Meta Lead Ads Instant Sync",
    category: "Marketing",
    tagline: "Instant Facebook & Instagram lead ingest.",
    description: "Sync Facebook and Instagram Lead Ad form submissions straight to your CRM contact lists in real time.",
    installType: "oauth",
    badge: "Popular",
    sortOrder: 21
  },
  {
    id: "tiktok-lead-ads",
    name: "TikTok Lead Ads Connector",
    category: "Marketing",
    tagline: "Capture viral TikTok ad leads instantly.",
    description: "Import lead submissions from TikTok Instant Forms directly into automated workflow sequences.",
    installType: "oauth",
    sortOrder: 22
  },
  {
    id: "linkedin-lead-gen",
    name: "LinkedIn Lead Gen Forms",
    category: "Marketing",
    tagline: "B2B professional lead form capture.",
    description: "Ingest professional lead form submissions from LinkedIn Sponsored Content campaigns.",
    installType: "oauth",
    sortOrder: 23
  },
  {
    id: "mailchimp-importer",
    name: "Mailchimp Audience Sync",
    category: "Marketing",
    tagline: "Migrate lists & tags from Mailchimp.",
    description: "Import legacy email subscribers, segment tags, and unsubscribe status directly into Nexlin.",
    installType: "apikey",
    sortOrder: 24
  },

  // CRM, E-Commerce & Customer Support (6)
  {
    id: "shopify-core",
    name: "Shopify Core E-Commerce",
    category: "E-Commerce",
    tagline: "Product catalog & abandoned cart sync.",
    description: "Sync live Shopify store products, order statuses, and launch automated abandoned cart SMS recovery.",
    installType: "oauth",
    badge: "E-Commerce",
    sortOrder: 25
  },
  {
    id: "woocommerce-bridge",
    name: "WooCommerce Store Sync",
    category: "E-Commerce",
    tagline: "WordPress store order & customer sync.",
    description: "Connect your WordPress WooCommerce store to track order totals and trigger post-purchase workflows.",
    installType: "config",
    sortOrder: 26
  },
  {
    id: "hubspot-importer",
    name: "HubSpot One-Click Importer",
    category: "CRM",
    tagline: "Migrate contacts, companies & deals.",
    description: "One-click migration wizard transferring contacts, company profiles, and pipeline deals from HubSpot.",
    installType: "oauth",
    sortOrder: 27
  },
  {
    id: "salesforce-bridge",
    name: "Salesforce Enterprise Sync",
    category: "CRM",
    tagline: "Bi-directional Enterprise CRM sync.",
    description: "Bi-directional data sync linking Nexlin agency leads to enterprise Salesforce accounts.",
    installType: "oauth",
    sortOrder: 28
  },
  {
    id: "calendly-migrator",
    name: "Calendly Migration Wizard",
    category: "CRM",
    tagline: "Import Calendly event configurations.",
    description: "Seamlessly import third-party Calendly event types and booking links into Nexlin Calendars.",
    installType: "apikey",
    sortOrder: 29
  },
  {
    id: "zendesk-support",
    name: "Zendesk Help Desk",
    category: "Support",
    tagline: "Sync support tickets with CRM contacts.",
    description: "Display customer support ticket history and agent notes directly alongside CRM contact profiles.",
    installType: "oauth",
    sortOrder: 30
  }
]
