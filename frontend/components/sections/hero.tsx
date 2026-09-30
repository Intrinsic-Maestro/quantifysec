"use client"

import Link from "next/link"
import { ArrowRight, TrendingDown, ShieldCheck, BarChart3, Activity, AlertTriangle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 hero-backdrop" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-primary/4 rounded-full blur-3xl" />

        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" className="text-foreground" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div className="space-y-8 animate-slide-up">
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
              <span className="live-dot" />
              Enterprise Cyber Risk Intelligence
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-balance">
                Quantify Your{" "}
                <span className="gradient-text">Cyber Risk.</span>
                <br />
                Make Security{" "}
                <span className="text-foreground">Measurable.</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                QuantifySec converts raw cybersecurity data into clear, measurable business risk intelligence —
                so CISOs and CFOs can make decisions with confidence, not guesswork.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { label: "Security Score", value: "87/100", color: "text-accent" },
                { label: "Risk Exposure", value: "$2.4M", color: "text-amber-500" },
                { label: "Critical Risks", value: "3", color: "text-rose-500" },
                { label: "Assets Monitored", value: "1,284", color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/ciso">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 gap-2">
                  View CISO Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="font-semibold px-8">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required · SOC 2 Type II · ISO 27001 · GDPR Ready
            </p>
          </div>

          {/* Right — Dashboard Preview */}
          <div className="hidden lg:block animate-scale-in">
            <HeroDashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroDashboardPreview() {
  const threatData = [38, 52, 41, 68, 57, 73, 49, 82, 61, 74, 58, 90]

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="text-xs font-semibold text-muted-foreground">QuantifySec — Security Operations</div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
          <span className="live-dot" />
          Live
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Metric row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Security Score", value: "87", unit: "/100", color: "text-accent", bg: "bg-accent/10" },
            { label: "Open Incidents", value: "12", unit: "", color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Critical Risks", value: "3", unit: "", color: "text-rose-500", bg: "bg-rose-500/10" },
          ].map((m) => (
            <div key={m.label} className={`${m.bg} rounded-lg p-3 border border-border/50`}>
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-xl font-bold ${m.color}`}>
                {m.value}<span className="text-xs font-medium opacity-60">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Threat Activity</span>
            <span className="text-xs text-muted-foreground">Last 12 hours</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {threatData.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-primary to-primary/40 transition-all"
                style={{ height: `${h}%`, opacity: i === threatData.length - 1 ? 1 : 0.7 }}
              />
            ))}
          </div>
        </div>

        {/* Risk table */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Risks</p>
          {[
            { risk: "Unpatched critical CVE on API gateway", sev: "Critical", score: 9.1 },
            { risk: "Excessive admin privilege exposure", sev: "High", score: 7.8 },
            { risk: "S3 bucket with public read access", sev: "High", score: 7.2 },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${r.sev === "Critical" ? "text-rose-500" : "text-amber-500"}`} />
                <span className="text-xs text-foreground truncate">{r.risk}</span>
              </div>
              <span className={`text-xs font-bold ml-2 ${r.sev === "Critical" ? "text-rose-500" : "text-amber-500"}`}>
                {r.score}
              </span>
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Activity className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">AI Insight</p>
              <p className="text-xs text-muted-foreground">
                3 unpatched vulnerabilities on internet-facing assets represent $1.8M estimated exposure.
                Patch within 48h to reduce risk by 62%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
