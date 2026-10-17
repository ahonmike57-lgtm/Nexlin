"use server"

import { db } from "@/lib/db"
import { requireTenantAuth } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getBlogPosts() {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const posts = await db.snapshot.findMany({
      where: { agencyId: auth.agencyId, version: "blog_post" },
      orderBy: { createdAt: "desc" }
    })

    const parsed = posts.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      ...(p.description ? JSON.parse(p.description) : {})
    }))

    return { success: true, posts: parsed }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createBlogPost(data: {
  title: string
  slug: string
  summary: string
  content: string
  author: string
  category: string
  coverImage?: string
  status: "draft" | "published"
}) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    const post = await db.snapshot.create({
      data: {
        agencyId: auth.agencyId,
        name: data.title.trim(),
        version: "blog_post",
        description: JSON.stringify({
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          summary: data.summary,
          content: data.content,
          author: data.author,
          blogCategory: data.category,
          coverImage: data.coverImage,
          status: data.status,
          publishedAt: data.status === "published" ? new Date().toISOString() : null
        })
      }
    })

    revalidatePath("/websites/blogs")
    return { success: true, post }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteBlogPost(id: string) {
  const auth = await requireTenantAuth("user")
  if (!auth.authorized || !auth.agencyId) {
    return { success: false, error: auth.error || "Unauthorized" }
  }

  try {
    await db.snapshot.deleteMany({
      where: { id, agencyId: auth.agencyId, version: "blog_post" }
    })

    revalidatePath("/websites/blogs")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export interface PublicBlogPost {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  author: string
  authorRole?: string
  blogCategory: string
  readTime: string
  coverImage?: string
  gradient?: string
  status: "published" | "draft"
  agencyName: string
  agencyId?: string
  createdAt: string
  featured?: boolean
}

const CURATED_SEED_POSTS: PublicBlogPost[] = [
  {
    id: "seed-1",
    title: "The Death of 14-Tool Stacks: Why High-Growth Agencies Are Migrating to Unified Operating Systems",
    slug: "death-of-14-tool-stacks",
    summary: "The average 7-figure agency wastes $4,200/mo and 18 engineering hours juggling fragmented CRM, dialer, CPQ, and email platforms. Here is how unified architecture changes unit economics.",
    readTime: "6 min read",
    author: "Elena Rostova",
    authorRole: "Head of Agency Architecture",
    blogCategory: "Agency Growth",
    gradient: "from-blue-600 to-indigo-800",
    featured: true,
    agencyName: "Nexlin Editorial",
    status: "published",
    createdAt: "2026-10-12T14:30:00Z",
    content: `For the past decade, scaling a digital agency followed a predictable, painful playbook:

1. Sign up for a legacy CRM to track contacts.
2. Bolt on a third-party dialer with expensive seat licenses and hidden per-minute markups.
3. Hook up a proposal tool like PandaDoc or Proposify for e-signatures.
4. Wire together Zapier or Make.com recipes to sync statuses across 14 fragmented tabs.
5. Hire an operations manager whose entire job is resolving broken webhook triggers.

The consequence? "SaaS Tax"—both financial and cognitive. When data is scattered across five different database silos, automated follow-ups arrive late, deals fall through the cracks, and sales reps spend more time copying fields between screens than talking to prospects.

### The True Cost of SaaS Fragmentation
When we audited 140 agencies generating between $50k and $500k monthly recurring revenue, the numbers were staggering:
- **Average monthly software spend:** $4,280 across 11 to 16 separate subscriptions.
- **Webhook failure rate:** 4.2% of customer interactions suffered data drop-off during third-party syncs.
- **Ramp time for new account managers:** 26 days simply to learn all internal dashboards.

### What Modern Unified Infrastructure Looks Like
A true agency Operating System doesn't just connect tools—it eliminates the seams altogether. 
When telephony, omnichannel conversations (SMS, WhatsApp, Email), CPQ proposals, and automated funnel tracking share a single multi-tenant database:
1. **Zero latency data synchronization:** An inbound call instantly accesses full CRM context, previous proposal terms, and open support tickets with sub-millisecond query performance.
2. **True White-Label Freedom:** Agency clients log into custom subdomains with zero trace of third-party branding.
3. **Wholesale carrier rates:** Telephony without 300% platform markups means agencies keep 100% of their re-billing margins.

The era of duct-taped SaaS stacks is over. Agencies competing in 2026 and beyond will either adopt unified platforms or be out-priced and out-executed by those who do.`
  },
  {
    id: "seed-2",
    title: "Autonomous Voice AI vs. Traditional Call Centers: Benchmarking Sub-300ms Conversational Latency",
    slug: "autonomous-voice-ai-latency-benchmark",
    summary: "How edge speech synthesis, WebRTC audio streaming, and neural LLM orchestrators are enabling conversational AI agents that outperform human receptionists on qualification speed.",
    readTime: "8 min read",
    author: "Marcus Chen",
    authorRole: "Principal AI Systems Engineer",
    blogCategory: "Voice AI",
    gradient: "from-emerald-600 to-teal-800",
    featured: false,
    agencyName: "Nexlin Labs",
    status: "published",
    createdAt: "2026-10-09T09:15:00Z",
    content: `In conversational voice interfaces, latency is not a performance metric—it is the difference between human conversation and uncanny robotic friction.

When a human speaks to another human on the phone, the natural conversational inter-pause is between **200ms and 350ms**. Anything longer than 500ms feels hesitant; anything past 800ms causes both speakers to start talking over each other simultaneously.

### The Traditional 4-Hop Latency Bottleneck
Legacy voice bots struggled because every conversational turn required four sequential network hops:
\`\`\`
1. Audio Packet Received -> PSTN / Twilio Gateway (150ms)
2. Audio Streaming to Speech-to-Text (Deepgram / Whisper) (300ms)
3. Text Prompt to Cloud LLM (OpenAI / Anthropic) (600ms - 1200ms)
4. LLM Completion to Text-to-Speech (ElevenLabs) (400ms)
Total Latency: 1450ms - 2050ms (Unusable in live sales calls)
\`\`\`

### How Nexlin Achieves Sub-300ms Turnaround
By co-locating neural streaming models with edge telephony endpoints, Nexlin collapses this pipeline:
- **Interruption-Aware Streaming VAD (Voice Activity Detection):** Micro-acoustic detection detects when the caller begins speaking, instantly pausing audio playback in 40ms.
- **Token Speculation & Direct PCM Chunking:** The moment the first 3 tokens emerge from Gemini 2.0 Flash or Claude 3.5 Haiku, they are piped straight into streaming neural vocoders without waiting for sentence boundary completion.
- **Bi-Directional WebRTC Media Streams:** Eliminates HTTP polling overhead entirely.

The result is an autonomous inbound voice receptionist that answers 24/7, books calendar slots directly into the agency CRM, and sends instant confirmation SMS messages before the caller even hangs up.`
  },
  {
    id: "seed-3",
    title: "CPQ & Dynamic Deal Rooms: How Interactive Proposals Increase Close Rates by 42%",
    slug: "cpq-dynamic-deal-rooms-increase-close-rates",
    summary: "Static PDFs are where high-ticket deals go to die. Discover how interactive quote configurators with real-time deposit collection turn proposals into instant checkout engines.",
    readTime: "5 min read",
    author: "Sarah Sterling",
    authorRole: "VP of Revenue Operations",
    blogCategory: "Sales CRM",
    gradient: "from-purple-600 to-pink-800",
    featured: false,
    agencyName: "Nexlin Editorial",
    status: "published",
    createdAt: "2026-10-05T11:45:00Z",
    content: `Every sales leader knows the dreaded "proposal black hole":
You finish a great 45-minute discovery call. The prospect is energized. You spend 3 hours drafting a 12-page PDF proposal, email it as an attachment, and then... crickets.

Did they open it? Did they forward it to their CFO? Did they get stuck on Section 4? You have zero visibility.

### Why Static PDF Proposals Fail
1. **Zero Telemetry:** You cannot see which pricing tiers or scope options the client lingered on.
2. **Friction-Filled Execution:** The client has to print, sign, scan, or struggle through an external signature app, then initiate an invoice payment separately.
3. **Inability to Re-configure:** If the client wants to remove a retainer item or add a setup package, the rep must regenerate and re-export the entire document.

### Enter the Interactive Deal Room
Nexlin CPQ transforms quotes into live, web-based checkout experiences:
- **Tiered Package Toggles:** Prospects can toggle between "Standard Retainer" and "Growth Retainer" or select optional add-on services with real-time price updates.
- **Live Viewing Analytics:** Sales reps receive an instant notification the exact second a decision maker opens the quote link.
- **Integrated Deposit Collection:** Clients sign with an on-screen signature pad and enter their credit card or bank details in the exact same interface. The deal automatically shifts to "Closed Won", the onboarding workflow triggers, and the kickoff email is sent within 3 seconds.`
  },
  {
    id: "seed-4",
    title: "Eliminating Carrier Re-Billing Markups: The Truth About Twilio Reselling in 2026",
    slug: "eliminating-carrier-rebilling-markups",
    summary: "Traditional agency CRM software charges up to 300% on top of carrier SMS and calling rates. Here is how direct SIP trunking and Bring-Your-Own-Carrier architecture protects agency profits.",
    readTime: "7 min read",
    author: "David Vance",
    authorRole: "Telephony Infrastructure Lead",
    blogCategory: "Telephony",
    gradient: "from-amber-600 to-orange-800",
    featured: false,
    agencyName: "Nexlin Engineering",
    status: "published",
    createdAt: "2026-09-28T16:20:00Z",
    content: `In the agency SaaS ecosystem, one of the best-kept secrets is the hidden profit engine of legacy CRM platforms: **Carrier Re-Billing Markup**.

When your agency sends 100,000 automated SMS reminders or makes 5,000 voice calls per month for client sub-accounts, who really captures the profit?

### The Hidden 300% Surcharge
When using legacy white-label CRM providers:
- Official Twilio wholesale SMS rate: ~$0.0079 per message.
- Provider platform fee: $0.025 to $0.035 per message.
The provider pockets a **300% to 400% markup** simply for acting as a middleman between your servers and Twilio! For an agency managing 30 local business clients, this phantom fee easily adds up to $1,500 to $4,000 every single month.

### Nexlin's 0% Carrier Surcharge Architecture
With Nexlin:
- You link your own Twilio, Telnyx, or SignalWire master credentials directly via AES-256 encrypted channel vaults.
- All outbound SMS, voice calls, and phone leasing fees are billed directly at true carrier wholesale prices.
- You have complete control to set your own rebilling multipliers for client sub-accounts—meaning **your agency keeps 100% of the markup revenue**, not the CRM software company.

Stop subsidizing software companies with your telephony volume. Control your carrier layer.`
  },
  {
    id: "seed-5",
    title: "Vibecode & Autonomous Funnel Generation: How AI Is Replacing Slow Web Design Agencies",
    slug: "vibecode-autonomous-funnel-generation",
    summary: "A behind-the-scenes look at how natural language prompts are compiled into high-converting, accessible React and Tailwind landing pages in under 8 seconds.",
    readTime: "6 min read",
    author: "Elena Rostova",
    authorRole: "Head of Agency Architecture",
    blogCategory: "AI Automation",
    gradient: "from-cyan-600 to-blue-800",
    featured: false,
    agencyName: "Nexlin Labs",
    status: "published",
    createdAt: "2026-09-20T10:00:00Z",
    content: `Building a custom marketing funnel used to take 2 weeks of wireframing, copywriting, Figma design, Webflow development, and tracking pixel integration.

With Nexlin Forge Vibecode, agency designers can describe an entire funnel concept in plain English:
> *"Build a high-ticket dental implant lead capture funnel with an emergency consultation booking calendar, testimonial video grid, financing calculator, and multi-step qualification quiz in dark obsidian styling."*

### Compiling Natural Language to DOM Nodes
Instead of returning generic placeholder text, Forge Vibecode utilizes a structured AST (Abstract Syntax Tree) compiler:
1. **Vertical Schema Resolution:** The AI automatically extracts industry-specific objections, warranty guarantees, and trust badges for the target sector.
2. **Component Token Mapping:** Design tokens are mapped to tested conversion patterns—sticky CTA bars, trust tickers, and mobile-optimized phone click-to-call buttons.
3. **Instant Preview & One-Click Publishing:** The compiled funnel is immediately editable in the visual drag-and-drop canvas and deployable to custom subdomains with automatic SSL certificates in under 10 seconds.

Welcome to the future of rapid client onboarding.`
  },
  {
    id: "seed-6",
    title: "Multi-Tenant Webhook Engineering: Handling 100,000 Inbound Webhooks/Sec with Inngest and Redis",
    slug: "multi-tenant-webhook-engineering-at-scale",
    summary: "Architecting zero-downtime event ingestion for Shopify stores, Twilio status callbacks, and Stripe webhooks across thousands of isolated agency sub-accounts.",
    readTime: "9 min read",
    author: "Marcus Chen",
    authorRole: "Principal AI Systems Engineer",
    blogCategory: "Engineering",
    gradient: "from-violet-600 to-purple-900",
    featured: false,
    agencyName: "Nexlin Engineering",
    status: "published",
    createdAt: "2026-09-12T08:30:00Z",
    content: `When building an omnichannel CRM, your biggest architectural enemy is not database query optimization—it is **webhook thundering herds**.

During Black Friday or large flash sales, a single e-commerce sub-account can generate 40,000 order creation webhooks in under 3 minutes. If your webhook receiver performs synchronous CRM database updates, your application pool exhausts connections, incoming phone calls drop, and the entire system slows to a crawl.

### The Decoupled Ingestion Architecture
To guarantee 99.99% uptime across all tenants, Nexlin isolates webhook reception from workflow execution:
\`\`\`
Client Webhook (Shopify / Stripe / Twilio)
       │
       ▼
Edge Route Handler (Fast 200 OK Return < 25ms)
       │
       ▼
Inngest Event Bus + Redis Sliding-Window Rate Limiter
       │
       ▼
Distributed Worker Queues (Step-Function Retries & Dead-Letter Isolation)
       │
       ▼
Tenant-Isolated Database Transactions
\`\`\`

### Tenant Fault Isolation
If an individual sub-account's third-party integration misbehaves and floods the endpoint with duplicate payloads:
- The tenant-scoped token bucket throttles that specific tenant's queue without impacting any other agency on the platform.
- Idempotency keys prevent duplicate contacts or repeat automation triggers.
- Full observability logs in the **Webhook Inspector** allow agency engineers to replay or inspect payloads with a single click.

Robust distributed systems aren't just for Big Tech—they are the foundation of mission-critical agency software.`
  }
]

export async function getPublicBlogPost(slug: string): Promise<PublicBlogPost | null> {
  const cleanSlug = slug.toLowerCase().trim()

  try {
    const posts = await db.snapshot.findMany({
      where: { version: "blog_post" },
      include: { agency: true }
    })

    for (const p of posts) {
      if (p.description) {
        try {
          const meta = JSON.parse(p.description)
          if (meta.slug === cleanSlug && meta.status === "published") {
            return {
              id: p.id,
              title: p.name,
              agencyName: p.agency?.name || "Nexlin Partner",
              agencyId: p.agencyId,
              slug: meta.slug,
              summary: meta.summary || "",
              content: meta.content || "",
              author: meta.author || "Agency Editor",
              authorRole: meta.authorRole || "Contributor",
              blogCategory: meta.blogCategory || "General",
              readTime: meta.readTime || `${Math.max(3, Math.ceil((meta.content?.length || 500) / 750))} min read`,
              coverImage: meta.coverImage,
              gradient: meta.gradient || "from-primary to-blue-700",
              status: meta.status,
              createdAt: p.createdAt.toISOString()
            }
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error("Error fetching public blog post from DB:", error)
  }

  // Fallback to curated seed posts
  const seed = CURATED_SEED_POSTS.find(s => s.slug === cleanSlug)
  if (seed) return seed

  return null
}

export async function getAllPublicBlogPosts(options?: {
  category?: string
  search?: string
}): Promise<PublicBlogPost[]> {
  const categoryFilter = options?.category && options.category !== "All" ? options.category.toLowerCase() : null
  const searchQuery = options?.search ? options.search.toLowerCase().trim() : null

  let dbArticles: PublicBlogPost[] = []
  try {
    const posts = await db.snapshot.findMany({
      where: { version: "blog_post" },
      include: { agency: true },
      orderBy: { createdAt: "desc" }
    })

    for (const p of posts) {
      if (p.description) {
        try {
          const meta = JSON.parse(p.description)
          if (meta.status === "published") {
            dbArticles.push({
              id: p.id,
              title: p.name,
              agencyName: p.agency?.name || "Nexlin Partner",
              agencyId: p.agencyId,
              slug: meta.slug,
              summary: meta.summary || "",
              content: meta.content || "",
              author: meta.author || "Agency Editor",
              authorRole: meta.authorRole || "Contributor",
              blogCategory: meta.blogCategory || "General",
              readTime: meta.readTime || `${Math.max(3, Math.ceil((meta.content?.length || 500) / 750))} min read`,
              coverImage: meta.coverImage,
              gradient: meta.gradient || "from-primary to-blue-700",
              status: meta.status,
              createdAt: p.createdAt.toISOString()
            })
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Could not load DB blog posts, using curated library:", err)
  }

  // Combine DB posts with curated seed posts (DB posts take priority)
  const allPosts = [...dbArticles, ...CURATED_SEED_POSTS]

  // Deduplicate by slug
  const uniquePostsMap = new Map<string, PublicBlogPost>()
  for (const post of allPosts) {
    if (!uniquePostsMap.has(post.slug)) {
      uniquePostsMap.set(post.slug, post)
    }
  }

  let results = Array.from(uniquePostsMap.values())

  // Apply Category filter
  if (categoryFilter) {
    results = results.filter(p => p.blogCategory.toLowerCase() === categoryFilter)
  }

  // Apply Search filter
  if (searchQuery) {
    results = results.filter(
      p =>
        p.title.toLowerCase().includes(searchQuery) ||
        p.summary.toLowerCase().includes(searchQuery) ||
        p.blogCategory.toLowerCase().includes(searchQuery) ||
        p.author.toLowerCase().includes(searchQuery)
    )
  }

  return results
}


