/**
 * Static vibecode prompt library.
 *
 * Kept in a plain module (no "use server" / "use client" directive) so it can
 * be imported by both server actions and client components without crossing the
 * server/client boundary.
 */
export const VIBECODE_PROMPTS = [
  // Landing Pages
  {
    id: "lp-1",
    category: "Landing Pages",
    title: "SaaS Hero Section",
    prompt:
      "Build a dark-mode SaaS landing page hero section with a gradient headline, subtitle, animated badge, and two CTA buttons. Use Tailwind CSS CDN only, no external dependencies.",
  },
  {
    id: "lp-2",
    category: "Landing Pages",
    title: "3-Tier Pricing Table",
    prompt:
      "Create a 3-tier pricing table (Starter / Pro / Enterprise) with a monthly/annual toggle that updates prices. Highlight the Pro tier with a 'Most Popular' badge. Tailwind CSS only.",
  },
  {
    id: "lp-3",
    category: "Landing Pages",
    title: "Feature Grid",
    prompt:
      "Design a 3-column feature grid for a SaaS app. Each card has an icon, title, and description. Add a subtle gradient card border on hover. Tailwind CSS only.",
  },
  // CRM Widgets
  {
    id: "crm-1",
    category: "CRM Widgets",
    title: "Contact Card",
    prompt:
      "Build a contact card component with avatar initials, full name, email, phone, company, lead score badge (0–100), and three action buttons (Call, Email, Note). Dark mode. Tailwind CSS only.",
  },
  {
    id: "crm-2",
    category: "CRM Widgets",
    title: "Kanban Pipeline Column",
    prompt:
      "Create a kanban pipeline column showing 3 sample deal cards. Each card has a deal title, contact name, value ($), and stage badge. Show column total at the top. Tailwind CSS only.",
  },
  {
    id: "crm-3",
    category: "CRM Widgets",
    title: "Activity Timeline",
    prompt:
      "Build a vertical activity timeline for a CRM contact showing 5 events: call, email sent, note added, deal moved, form submitted. Each item has icon, description, and relative timestamp. Tailwind CSS only.",
  },
  // Email Templates
  {
    id: "email-1",
    category: "Email Templates",
    title: "Welcome Email",
    prompt:
      "Design a self-contained HTML email for a SaaS welcome onboarding. Include a logo placeholder, personalized greeting, 3 getting-started steps with icons, and a primary CTA button. Inline styles only (no Tailwind, emails don't support CDN).",
  },
  {
    id: "email-2",
    category: "Email Templates",
    title: "Cold Outreach Follow-Up",
    prompt:
      "Write a 3-email cold outreach drip sequence as HTML. Email 1: introduction (Day 0). Email 2: value prop (Day 3). Email 3: breakup (Day 7). Minimal styling, professional tone. Inline styles only.",
  },
  // Automations
  {
    id: "auto-1",
    category: "Automations",
    title: "Lead Nurture Workflow",
    prompt:
      "Create a visual HTML diagram of a 5-step lead nurture automation flow: Form Submit → Welcome Email (Day 0) → Follow-up SMS (Day 3) → Value Email (Day 7) → Book Call Task (Day 14). Use colored boxes with arrows. Tailwind CSS only.",
  },
  {
    id: "auto-2",
    category: "Automations",
    title: "Missed Call Text-Back",
    prompt:
      "Build a UI mockup for a 'Missed Call Text-Back' automation configurator. Show trigger (Missed Call), wait step (2 minutes), and SMS action with template editor. Tailwind CSS only.",
  },
  // Forms
  {
    id: "form-1",
    category: "Forms",
    title: "Multi-Step Lead Form",
    prompt:
      "Build a 3-step lead capture form with a progress bar: Step 1 = First Name + Last Name + Email. Step 2 = Phone + Company + Industry dropdown. Step 3 = Budget select + Timeline select + Submit. Dark mode. Tailwind CSS only.",
  },
  // Voice AI
  {
    id: "voice-1",
    category: "Voice AI",
    title: "Call Transcript Viewer",
    prompt:
      "Build a call transcript viewer UI showing an AI vs Human conversation. Each message shows speaker label, timestamp, and text. AI messages are left-aligned, human right-aligned. Add a sentiment badge and call summary below. Tailwind CSS only.",
  },
] as const

export type VibePrompt = (typeof VIBECODE_PROMPTS)[number]
export type VibeCategory = VibePrompt["category"]
