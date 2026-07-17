# Nexlin GHL

Nexlin GHL is an open-source "all-in-one" marketing CRM and agency operating system built on Next.js 15, Prisma, and TailwindCSS. It provides a full GoHighLevel (GHL) alternative out-of-the-box.

## Core Features

- **Multi-tenant Architecture**: Support for an Agency layer with infinite Sub-accounts.
- **CRM & Opportunities**: Visual drag-and-drop kanban boards to manage deals.
- **Unified Inbox**: Chat with contacts across Email, SMS, and Social in one thread.
- **Funnels & Websites**: Drag-and-drop page builder.
- **Forms & Surveys**: Visual builder to capture leads.
- **Automations**: React Flow based visual workflow engine to trigger emails, webhooks, and SMS.
- **App Marketplace**: Extensibility via third-party integrations and MCP servers.
- **Voice AI & AI Coach**: Natively integrated AI calling and copy generation via Gemini & ElevenLabs.
- **Reputation Management**: Auto-request reviews and manage online reputation.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: TailwindCSS & `shadcn/ui`
- **Real-time**: Pusher
- **Email**: Resend
- **SMS**: Twilio
- **Billing**: Stripe / Paystack

## Deployment Guide (Vercel)

1. Clone this repository and push it to your GitHub account.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. In the environment variables section, copy the variables from `.env.example`.
4. Run `npx prisma generate` and `npx prisma db push` to synchronize your database schema before deploying.
5. Hit **Deploy**. Vercel will automatically run the `postinstall` script to generate the Prisma client before building.

## Local Development

1. Run `npm install`.
2. Copy `.env.example` to `.env` and fill in your keys.
3. Run `npx prisma db push` to push the schema to your DB.
4. Run `npm run dev` to start the development server on `localhost:3000`.
