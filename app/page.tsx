"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, BarChart3, Bot, Globe, Shield, PhoneCall, Route, Zap, Quote, Heart } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { ScrollSmoother } from "gsap/ScrollSmoother";

// Register GSAP plugins
gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, SplitText, ScrollSmoother);

export default function Home() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Register custom ease
    CustomEase.create('nexlin', 'M0,0 C0.05,0.85 0.15,1 1,1');

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. ScrollSmoother Setup
      ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.2,
        effects: true,
      });

      // 2. Navbar
      ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        toggleClass: { className: 'bg-bg-primary/95 backdrop-blur-md shadow-sm h-14', targets: '.navbar' }
      });
      gsap.from(".nav-logo", { opacity: 0, duration: 0.5, ease: "nexlin" });

      // 3. Hero Sequence
      const heroSplit = new SplitText(".hero-heading", { type: "lines" });
      const heroTl = gsap.timeline();
      
      heroTl.from(heroSplit.lines, { 
        y: 30, opacity: 0, duration: 0.4, stagger: 0.05, ease: "nexlin", delay: 0.1 
      })
      .from(".hero-subhead", { opacity: 0, y: 15, duration: 0.3, ease: "nexlin" }, "-=0.2")
      .from(".hero-cta", { opacity: 0, y: 10, duration: 0.3, stagger: 0.05, ease: "nexlin" }, "-=0.1")
      .fromTo(".hero-mockup", 
        { scale: 0.96, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: "nexlin" }, 
        "-=0.2"
      );

      // Ambient gradient loop
      gsap.to(".ambient-gradient", { rotate: 360, duration: 30, repeat: -1, ease: "none" });

      // 4. Call Porter (Signature Moment)
      const porterTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".call-porter-section",
          start: "top 60%",
          end: "bottom 80%",
          scrub: 1,
        }
      });
      
      porterTl.fromTo(".cp-node-1", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 })
              .fromTo(".cp-path-1", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1 })
              .fromTo(".cp-node-2", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 })
              .fromTo(".cp-path-2", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1 })
              .fromTo(".cp-node-3", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 })
              .to(".cp-pulse", { opacity: 0.5, scale: 1.5, repeat: 2, yoyo: true, duration: 0.3 });

      // 5. Feature Grid
      ScrollTrigger.batch('.feature-card', {
        start: "top 85%",
        onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 20, duration: 0.4, stagger: 0.05, ease: "nexlin", overwrite: true }),
        onLeaveBack: (batch) => gsap.to(batch, { opacity: 0, y: 10, duration: 0.25, stagger: 0.03, ease: "power1.in", overwrite: true })
      });

      // 6. Stats Count-up
      gsap.utils.toArray('.stat-number').forEach((stat: any) => {
        const target = parseFloat(stat.getAttribute('data-target') || '0');
        gsap.to(stat, {
          scrollTrigger: { trigger: stat, start: "top 90%" },
          innerHTML: target,
          duration: 1.5,
          ease: "nexlin",
          snap: { innerHTML: 1 },
          onUpdate: function() {
            stat.innerHTML = Math.round(this.targets()[0].innerHTML).toLocaleString() + (stat.getAttribute('data-suffix') || '');
          }
        });
      });

      // 7. Pricing Stagger & Recommended Tier
      gsap.from(".pricing-card", {
        scrollTrigger: { trigger: ".pricing-section", start: "top 75%" },
        y: 30, opacity: 0, duration: 0.4, stagger: 0.05, ease: "nexlin",
        onComplete: () => {
          gsap.to(".pricing-recommended", { scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.1)", duration: 0.4, ease: "nexlin" });
        }
      });

      // Pricing Magnetic Hover
      gsap.utils.toArray('.pricing-card').forEach((card: any) => {
        card.addEventListener('mouseenter', () => gsap.to(card, { y: -6, duration: 0.3, ease: "nexlin" }));
        card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.3, ease: "nexlin" }));
      });

      // 8. Testimonials
      gsap.to(".marquee-track", { xPercent: -50, ease: "none", duration: 30, repeat: -1 });
      gsap.to(".testimonial-cards-track", {
        scrollTrigger: { trigger: ".testimonials-section", start: "top bottom", end: "bottom top", scrub: 1 },
        x: "-10vw", ease: "none"
      });

      // 9. Final CTA
      gsap.from(".final-cta-bg", {
        scrollTrigger: { trigger: ".final-cta-section", start: "top 80%" },
        opacity: 0, duration: 0.5, ease: "nexlin"
      });
      gsap.from(".final-cta-heading", {
        scrollTrigger: { trigger: ".final-cta-section", start: "top 80%" },
        scale: 0.95, opacity: 0, duration: 0.4, ease: "nexlin"
      });

      // Final CTA Magnetic Button
      const magnetBtn = document.querySelector('.magnetic-btn') as HTMLElement;
      if (magnetBtn) {
        const xTo = gsap.quickTo(magnetBtn, "x", {duration: 0.3, ease: "nexlin"}),
              yTo = gsap.quickTo(magnetBtn, "y", {duration: 0.3, ease: "nexlin"});
        magnetBtn.addEventListener("mousemove", (e) => {
          const rect = magnetBtn.getBoundingClientRect();
          const x = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
          const y = (e.clientY - (rect.top + rect.height / 2)) * 0.15;
          xTo(x); yTo(y);
        });
        magnetBtn.addEventListener("mouseleave", () => {
          xTo(0); yTo(0);
        });
      }
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Instant display for accessibility
      gsap.set(".hero-heading, .hero-subhead, .hero-cta, .hero-mockup, .feature-card, .pricing-card, .final-cta-heading, .final-cta-bg", { opacity: 1, y: 0, scale: 1 });
      gsap.set(".cp-node-1, .cp-node-2, .cp-node-3, .cp-pulse", { scale: 1, opacity: 1 });
      gsap.set(".cp-path-1, .cp-path-2", { strokeDashoffset: 0 });
    });

    return () => mm.revert();
  }, { scope: container });

  return (
    <div ref={container} className="bg-bg-primary text-text-primary">
      <div id="smooth-wrapper">
        <div id="smooth-content">
          
          {/* Navbar */}
          <header className="navbar fixed top-0 z-50 w-full bg-transparent transition-all duration-300 flex h-16 items-center border-b border-transparent">
            <div className="container mx-auto flex items-center justify-between px-4 sm:px-8">
              <div className="nav-logo flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-primary">NEXLIN</span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="#call-porter" className="hover:text-primary transition-colors">Call Porter</Link>
                <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
                <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </nav>
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
                <Link href="/register"><Button size="sm">Get Started</Button></Link>
              </div>
            </div>
          </header>

          <main>
            {/* Hero Section */}
            <section className="relative px-4 pt-40 pb-24 sm:px-8 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center text-center">
              <div className="ambient-gradient absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0%,var(--color-primary)_50%,transparent_100%)] opacity-[0.03] -z-10 pointer-events-none" />
              
              <div className="hero-cta inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                The Next-Gen Business OS
              </div>
              <h1 className="hero-heading text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8 max-w-5xl leading-[1.1]">
                Every part of your business. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  One intelligent platform.
                </span>
              </h1>
              <p className="hero-subhead mx-auto max-w-2xl text-lg text-text-secondary mb-10 sm:text-xl leading-relaxed">
                NEXLIN is an all-in-one business operating system built for modern enterprises. From AI-driven CRM to global payments, manage it all beautifully.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="hero-cta">
                  <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8">
                    Start your free trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Hero Mockup */}
              <div className="hero-mockup mt-20 w-full max-w-6xl mx-auto rounded-xl border border-border bg-bg-secondary/50 shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-primary to-bg-secondary opacity-50" />
                <div className="text-text-secondary font-medium tracking-widest text-sm uppercase">[ Dashboard Mockup ]</div>
              </div>
            </section>

            {/* Call Porter Signature Moment */}
            <section id="call-porter" className="call-porter-section py-32 bg-bg-primary px-4 sm:px-8 border-y border-border overflow-hidden relative">
              <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">Call Porter routing. <br/>Intelligent by default.</h2>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    Stop routing calls manually. Our AI listens to the context, identifies the caller, and transfers them directly to the most qualified available agent in under 200ms.
                  </p>
                </div>
                
                {/* Visual Sequence */}
                <div className="relative h-[400px] w-full bg-bg-secondary/30 rounded-2xl border border-border p-8 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                    {/* Paths */}
                    <path id="routing-path-1" className="cp-path-1 text-primary/30" d="M 50,200 L 150,200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
                    <path id="routing-path-2" className="cp-path-2 text-primary/30" d="M 230,200 L 330,200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100" strokeDashoffset="100" />
                  </svg>
                  
                  <div className="absolute inset-0 flex items-center justify-between px-10">
                    <div className="cp-node-1 flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-bg-primary border border-border rounded-full flex items-center justify-center shadow-sm">
                        <PhoneCall className="w-6 h-6 text-text-secondary" />
                      </div>
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Incoming</span>
                    </div>

                    <div className="cp-node-2 flex flex-col items-center gap-3 z-10">
                      <div className="h-20 w-20 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <Route className="w-8 h-8 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Router</span>
                    </div>

                    <div className="cp-node-3 flex flex-col items-center gap-3 relative">
                      <div className="cp-pulse absolute inset-0 bg-success/20 rounded-full scale-150 opacity-0 pointer-events-none" />
                      <div className="h-16 w-16 bg-bg-primary border border-border rounded-full flex items-center justify-center shadow-sm relative z-10">
                        <div className="absolute top-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-bg-primary" />
                        <Bot className="w-6 h-6 text-text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Agent</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-b border-border bg-bg-secondary/50">
              <div className="container mx-auto max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="py-4">
                    <div className="text-4xl sm:text-6xl font-extrabold text-primary mb-2">
                      <span className="stat-number" data-target="150" data-suffix="M+">0</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Calls Automated</p>
                  </div>
                  <div className="py-4">
                    <div className="text-4xl sm:text-6xl font-extrabold text-text-primary mb-2">
                      <span className="stat-number" data-target="4.9" data-suffix="/5">0</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Customer Rating</p>
                  </div>
                  <div className="py-4">
                    <div className="text-4xl sm:text-6xl font-extrabold text-text-primary mb-2">
                      $<span className="stat-number" data-target="2" data-suffix="B+">0</span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary uppercase tracking-widest">Payments Processed</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-4 sm:px-8">
              <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-20 max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need to scale</h2>
                  <p className="text-text-secondary text-lg">Enterprise-grade tools engineered with strict precision, offered at SMB pricing.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard icon={<Bot />} title="AI-Native Architecture" description="Built with Claude AI at its core. From writing emails to predictive analytics and voice agents." />
                  <FeatureCard icon={<Globe />} title="Dual Global Payments" description="Seamlessly accept payments via Stripe globally, and Paystack for African markets." />
                  <FeatureCard icon={<BarChart3 />} title="Advanced Analytics" description="Cohort analysis, churn prediction, and white-labeled AI-generated business reports." />
                  <FeatureCard icon={<Shield />} title="Multi-Tenancy" description="Agency owners can rebrand the entire platform, run custom sub-domains, and set pricing." />
                  <FeatureCard icon={<Zap />} title="Complete CRM" description="Visual Kanban boards, lead scoring, custom objects, and multi-channel communication hub." />
                  <FeatureCard icon={<Route />} title="Visual Flow Automation" description="Infinite canvas drag-and-drop workflow builder to automate marketing, sales, and ops." />
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials-section py-32 bg-bg-primary overflow-hidden border-y border-border">
              {/* Marquee Logos */}
              <div className="mb-20 overflow-hidden whitespace-nowrap flex opacity-50 relative">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10" />
                <div className="marquee-track inline-flex gap-16 px-8 items-center text-xl font-bold text-text-secondary uppercase tracking-widest w-[200%]">
                  <span>Acme Corp</span><span>Globex</span><span>Soylent</span><span>Initech</span><span>Umbrella</span><span>Stark Ind.</span>
                  <span>Acme Corp</span><span>Globex</span><span>Soylent</span><span>Initech</span><span>Umbrella</span><span>Stark Ind.</span>
                </div>
              </div>

              {/* Scroll-Linked Cards */}
              <div className="container mx-auto">
                <div className="testimonial-cards-track flex gap-6 w-[200vw] px-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-[400px] shrink-0 bg-bg-secondary p-8 rounded-2xl border border-border">
                      <Quote className="w-8 h-8 text-primary/40 mb-6" />
                      <p className="text-lg leading-relaxed mb-6 font-medium text-text-primary">
                        "Moving from GoHighLevel to NEXLIN was the best decision for our agency. The AI routing alone saved us 40 hours a week in triage."
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-border rounded-full" />
                        <div>
                          <p className="font-semibold text-sm">Sarah Jenkins</p>
                          <p className="text-xs text-text-secondary">CEO, Jenkins Digital</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="pricing-section py-32 px-4 sm:px-8 bg-bg-secondary/30">
              <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-20">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">Transparent Enterprise Pricing</h2>
                  <p className="text-text-secondary text-lg">No hidden fees. Scale infinitely.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
                  <div className="pricing-card bg-bg-primary border border-border p-8 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-2">Starter</h3>
                    <p className="text-text-secondary text-sm mb-6">For emerging agencies.</p>
                    <div className="text-4xl font-bold mb-6">$97<span className="text-lg text-text-secondary font-normal">/mo</span></div>
                    <ul className="space-y-3 mb-8 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> 3 Sub-accounts</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Core CRM</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Email Support</li>
                    </ul>
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </div>
                  
                  <div className="pricing-card pricing-recommended bg-bg-primary border-2 border-primary p-8 rounded-2xl relative z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">Recommended</div>
                    <h3 className="text-xl font-semibold mb-2 text-primary">Pro</h3>
                    <p className="text-text-secondary text-sm mb-6">For scaling teams.</p>
                    <div className="text-4xl font-bold mb-6">$297<span className="text-lg text-text-secondary font-normal">/mo</span></div>
                    <ul className="space-y-3 mb-8 text-sm font-medium">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Unlimited Sub-accounts</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Advanced AI Routing</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> API Access</li>
                    </ul>
                    <Button className="w-full">Get Started</Button>
                  </div>

                  <div className="pricing-card bg-bg-primary border border-border p-8 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                    <p className="text-text-secondary text-sm mb-6">For custom deployments.</p>
                    <div className="text-4xl font-bold mb-6">Custom</div>
                    <ul className="space-y-3 mb-8 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Dedicated Infrastructure</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Custom AI Models</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> 24/7 Phone Support</li>
                    </ul>
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta-section py-32 px-4 sm:px-8 relative overflow-hidden flex justify-center items-center">
              <div className="final-cta-bg absolute inset-0 bg-gradient-to-b from-bg-primary to-primary/5 -z-10" />
              <div className="text-center max-w-3xl">
                <h2 className="final-cta-heading text-4xl font-extrabold tracking-tight sm:text-6xl mb-8">Ready to upgrade your OS?</h2>
                <Button size="lg" className="magnetic-btn h-14 px-8 text-base">
                  Start your free 14-day trial
                </Button>
              </div>
            </section>
          </main>

          <footer className="border-t border-border py-12 bg-bg-primary text-center">
            <div className="container mx-auto flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-border flex items-center justify-center mb-4">
                <span className="text-text-secondary font-bold text-xl">N</span>
              </div>
              <p className="text-text-secondary text-sm">&copy; {new Date().getFullYear()} NEXLIN. Built with <Heart className="inline w-3 h-3 text-error mx-1" /> for modern business.</p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="feature-card rounded-2xl border border-border bg-bg-primary p-8 shadow-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-bg-secondary text-text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-text-secondary leading-relaxed text-sm">{description}</p>
    </div>
  );
}
