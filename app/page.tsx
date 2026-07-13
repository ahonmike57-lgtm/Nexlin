"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, BarChart3, Bot, Globe, Shield } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">NEXLIN GHL</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-primary transition-colors">Solutions</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 pt-32 pb-20 sm:px-8 md:pt-40 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_100%)] opacity-5 -z-10" />
          <motion.div 
            className="container mx-auto max-w-5xl text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              The Next-Gen Business OS
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8">
              Every part of your business. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                One intelligent platform.
              </span>
            </motion.h1>
            <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-lg text-text-secondary mb-10 sm:text-xl">
              NEXLIN GHL is an all-in-one business operating system built for modern enterprises. From CRM and marketing to AI automation and global payments, manage it all beautifully.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Start your free trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  Book a Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-bg-secondary px-4 sm:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to scale</h2>
              <p className="mt-4 text-text-secondary text-lg">Enterprise-grade tools at SMB pricing.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Bot className="h-6 w-6 text-primary" />}
                title="AI-Native Architecture"
                description="Built with Claude AI at its core. From writing emails to predictive analytics and voice agents, AI is everywhere."
              />
              <FeatureCard 
                icon={<Globe className="h-6 w-6 text-secondary" />}
                title="Dual Global Payments"
                description="Seamlessly accept payments via Stripe globally, and Paystack for African markets, automatically routed."
              />
              <FeatureCard 
                icon={<BarChart3 className="h-6 w-6 text-success" />}
                title="Advanced Analytics"
                description="Cohort analysis, churn prediction, and white-labeled AI-generated business reports."
              />
              <FeatureCard 
                icon={<Shield className="h-6 w-6 text-warning" />}
                title="White-Label & Multi-Tenancy"
                description="Agency owners can rebrand the entire platform, run custom sub-domains, and set their own pricing."
              />
              <FeatureCard 
                icon={<CheckCircle className="h-6 w-6 text-primary" />}
                title="Complete CRM & Pipeline"
                description="Visual Kanban boards, lead scoring, custom objects, and multi-channel communication hub."
              />
              <FeatureCard 
                icon={<Bot className="h-6 w-6 text-secondary" />}
                title="Visual Flow Automation"
                description="Infinite canvas drag-and-drop workflow builder to automate marketing, sales, and operations."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-bg-primary text-center">
        <p className="text-text-secondary">&copy; {new Date().getFullYear()} NEXLIN GHL. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-primary p-8 shadow-soft transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-bg-secondary">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
