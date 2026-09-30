"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Shield, TrendingDown, AlertTriangle, Activity, Server,
  ArrowRight, ChevronRight, Zap, CheckCircle2, Globe, Brain,
  DollarSign, BarChart3, Lock, Eye
} from "lucide-react"

// ─── Live pulse events for hero ─────────────────────────────────────────────
const HERO_EVENTS = [
  { threat: "SQL Injection", asset: "prod-api-gateway", impact: "$320K", action: "Patch exposed endpoint", level: "Critical" },
  { threat: "Brute Force Attack", asset: "VPN Concentrator", impact: "$180K", action: "Enable adaptive MFA", level: "High" },
  { threat: "S3 Data Exposure", asset: "s3://customer-data", impact: "$720K", action: "Restrict bucket ACL", level: "Critical" },
  { threat: "Privilege Escalation", asset: "AD Domain Controller", impact: "$450K", action: "Apply least-privilege", level: "High" },
  { threat: "Weak TLS 1.0", asset: "legacy-portal.acme.com", impact: "$120K", action: "Upgrade to TLS 1.3", level: "Medium" },
]

const LEVEL_COLORS: Record<string, string> = {
  Critical: "text-rose-500",
  High: "text-orange-500",
  Medium: "text-amber-500",
}

// ─── Risk Graph visualization ─────────────────────────────────────────────────
const GRAPH_NODES = [
  { id: "internet", label: "Internet", x: 50, y: 8, type: "external" },
  { id: "api", label: "API Gateway", x: 50, y: 26, type: "asset" },
  { id: "vuln", label: "CVE-2024-3400", x: 50, y: 44, type: "vuln" },
  { id: "risk", label: "Critical Risk", x: 50, y: 62, type: "risk" },
  { id: "impact", label: "$1.2M Exposure", x: 50, y: 80, type: "impact" },
]

const typeColors: Record<string, string> = {
  external: "bg-muted/50 border-border/50 text-muted-foreground",
  asset: "bg-primary/10 border-primary/30 text-primary",
  vuln: "bg-rose-500/10 border-rose-500/30 text-rose-500",
  risk: "bg-orange-500/10 border-orange-500/30 text-orange-500",
  impact: "bg-amber-500/10 border-amber-500/30 text-amber-600",
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,91,219,0.5)]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Quantify<span className="text-primary">Sec</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {["Platform", "Solutions", "Intelligence", "Reports"].map(item => (
            <button key={item} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Sign In</Link>
          <Link href="/login" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,91,219,0.35)] hover:shadow-[0_0_25px_rgba(59,91,219,0.55)]">
            Request Demo
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  const [activeEvent, setActiveEvent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveEvent(i => (i + 1) % HERO_EVENTS.length), 3000)
    return () => clearInterval(id)
  }, [])

  const ev = HERO_EVENTS[activeEvent]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
      {/* Radial background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-rose-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary">
            <span className="live-dot" />
            Enterprise Cyber Risk Intelligence Platform
          </span>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-foreground">
            Turn security data into<br />
            <span className="text-primary">business decisions</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            QuantifySec translates technical vulnerabilities into financial risk — giving your CISO and CFO a shared language for cybersecurity investment.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(59,91,219,0.45)]">
            See Live Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-card text-foreground font-semibold rounded-lg border border-border hover:bg-muted/50 transition-all">
            <Eye className="w-4 h-4" /> View Dashboard
          </Link>
        </div>

        {/* Product preview — Threat → Risk → Impact → Action */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left: Threat Flow */}
          <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs font-medium text-muted-foreground font-mono ml-2">risk-intelligence.tsx</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
                <span className="live-dot" /> LIVE
              </span>
            </div>

            <div className="p-5 space-y-3">
              {/* Threat → Risk → Impact → Action chain */}
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Active Risk Chain</div>

              <div className="space-y-1 relative">
                <div className={`p-3 rounded-lg border ${LEVEL_COLORS[ev.level] === "text-rose-500" ? "border-rose-500/30 bg-rose-500/5" : LEVEL_COLORS[ev.level] === "text-orange-500" ? "border-orange-500/30 bg-orange-500/5" : "border-amber-500/30 bg-amber-500/5"} transition-all`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Threat</span>
                    <span className={`text-[10px] font-bold font-mono tracking-widest ${LEVEL_COLORS[ev.level]}`}>{ev.level}</span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{ev.threat}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{ev.asset}</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-border/80" />
                </div>

                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Business Impact</p>
                  <p className="font-bold font-mono text-amber-500 text-lg">{ev.impact}</p>
                  <p className="text-xs text-muted-foreground">Potential financial exposure</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-border/80" />
                </div>

                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommended Action</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{ev.action}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Metrics snapshot */}
          <div className="space-y-4">
            {/* Security Score Card */}
            <div className="bg-card/80 border border-border/60 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/30" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#0CA678" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * 0.13}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black font-mono">87</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">Security Score</p>
                  <p className="text-xs text-emerald-500 font-medium mt-0.5">↑ +3 from last month</p>
                  <div className="mt-2 space-y-1">
                    {[{ l: "Identity", s: 94 }, { l: "Endpoint", s: 91 }, { l: "Cloud", s: 65 }].map(d => (
                      <div key={d.l} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14">{d.l}</span>
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.s}%`, backgroundColor: d.s >= 80 ? "#0CA678" : "#F59E0B" }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold">{d.s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Risk metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/80 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Risk Exposure</p>
                <p className="text-2xl font-black font-mono text-amber-500">$4.2M</p>
                <p className="text-xs text-emerald-500 mt-1">↓ $340K this quarter</p>
              </div>
              <div className="bg-card/80 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Security ROI</p>
                <p className="text-2xl font-black font-mono text-primary">4.2×</p>
                <p className="text-xs text-muted-foreground mt-1">Risk reduced per $ spent</p>
              </div>
            </div>

            {/* Assets */}
            <div className="bg-card/80 border border-border/60 rounded-xl p-4 backdrop-blur-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Server className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-bold font-mono text-lg">1,284</p>
                <p className="text-xs text-muted-foreground">Assets monitored in real-time</p>
              </div>
              <div className="ml-auto text-right">
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10">
                  <span className="live-dot" /> Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Ingest Your Security Data", desc: "Connect your existing tools — SIEM, vulnerability scanners, cloud providers, endpoints. QuantifySec normalizes and analyzes all signals." },
    { n: "02", title: "Quantify Risk in Financial Terms", desc: "Every vulnerability is mapped to financial exposure using industry-calibrated Monte Carlo simulations — not guesswork." },
    { n: "03", title: "Prioritize by Business Impact", desc: "Instead of chasing CVE scores, see which risks threaten your revenue and reputation most. Remediate with confidence." },
    { n: "04", title: "Report to the Board", desc: "Generate executive-grade risk reports your CFO and board can act on — in minutes, not weeks." },
  ]
  return (
    <section className="py-24 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="section-label">How It Works</p>
          <h2 className="text-4xl font-bold tracking-tight">Security data is valuable. Only when it speaks business.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-border/50 -translate-y-0.5 z-0" style={{ width: "calc(100% - 2rem)" }} />
              )}
              <div className="relative">
                <span className="text-5xl font-black text-muted/20 font-mono leading-none block mb-4">{s.n}</span>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Dual Personas Section ─────────────────────────────────────────────────────
function DualPersonas() {
  return (
    <section className="py-24 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="section-label">Built for Two Audiences</p>
          <h2 className="text-4xl font-bold tracking-tight">One platform. Two perspectives.</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* CISO */}
          <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold">CISO Dashboard</p>
                  <p className="text-xs text-muted-foreground">Security Command Center</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Real-time threat intelligence and live security signals", "CVE prioritization by financial impact — not just CVSS score", "Attack surface visibility across all assets", "AI Security Analyst for instant analysis and guidance", "Compliance tracking and audit-ready reporting"].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline group-hover:gap-3 transition-all">
                Open CISO Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* CFO */}
          <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/5 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold">CFO Dashboard</p>
                  <p className="text-xs text-muted-foreground">Financial Risk Intelligence</p>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Total risk exposure in dollar terms — always current", "Security investment vs risk reduction ROI analysis", "Probability-weighted loss projections (Monte Carlo)", "Budget allocation recommendations across security domains", "Board-ready executive reports in one click"].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:underline group-hover:gap-3 transition-all">
                Open CFO Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Risk Graph Visualization ─────────────────────────────────────────────────
function RiskGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  return (
    <section className="py-24 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label">Risk Intelligence Graph</p>
            <h2 className="text-4xl font-bold tracking-tight mb-4">See the chain from threat to business impact</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every security finding is linked to its origin threat, the assets it affects, and the financial exposure it creates. QuantifySec makes this chain visible — so your team knows exactly what to fix and why.
            </p>
            <div className="space-y-3">
              {[
                { icon: Globe, label: "Threat Origin", desc: "Where does the attack surface begin?" },
                { icon: AlertTriangle, label: "Vulnerability Chain", desc: "Which assets are exposed?" },
                { icon: DollarSign, label: "Financial Impact", desc: "What does it cost if exploited?" },
                { icon: CheckCircle2, label: "Recommended Action", desc: "What should the team do next?" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graph visual */}
          <div className="bg-card border border-border rounded-2xl p-8 relative">
            <div className="flex flex-col items-center gap-0 relative" style={{ minHeight: 380 }}>
              {GRAPH_NODES.map((node, i) => (
                <div key={node.id} className="flex flex-col items-center w-full" style={{ position: "relative" }}>
                  <div
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`w-full max-w-xs px-5 py-3 rounded-xl border cursor-pointer transition-all duration-200 text-center ${typeColors[node.type]} ${hoveredNode === node.id ? "scale-105 shadow-lg" : ""}`}
                  >
                    <p className="font-semibold text-sm">{node.label}</p>
                    {hoveredNode === node.id && (
                      <p className="text-xs mt-1 opacity-70">
                        {node.type === "external" && "Attack origin — internet-facing"}
                        {node.type === "asset" && "12 open vulnerabilities detected"}
                        {node.type === "vuln" && "CVSS 10.0 · Remote Code Execution"}
                        {node.type === "risk" && "Immediate action required"}
                        {node.type === "impact" && "Probability-weighted ALE estimate"}
                      </p>
                    )}
                  </div>
                  {i < GRAPH_NODES.length - 1 && (
                    <div className="flex flex-col items-center my-1">
                      <div className="w-px h-5 bg-border/60" />
                      <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 -my-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: "68%", label: "Average risk reduction after first quarter" },
    { value: "4.2×", label: "Security investment ROI for enterprise customers" },
    { value: "<2min", label: "Time to generate an executive-ready board report" },
    { value: "1,284+", label: "Assets monitored per enterprise deployment" },
  ]
  return (
    <section className="py-16 border-y border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.value} className="text-center">
              <p className="text-4xl font-black font-mono text-primary mb-2">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 border-t border-border/50">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,91,219,0.5)]">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          Make cybersecurity<br />financially measurable
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          QuantifySec gives CISOs and CFOs a shared risk language — converting technical data into business decisions that protect revenue, reputation, and operations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(59,91,219,0.4)]">
            Start with Demo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-card text-foreground font-semibold rounded-lg border border-border hover:bg-muted/50 transition-all">
            View CFO Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm">Quantify<span className="text-primary">Sec</span></span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2025 QuantifySec. Demo data — not real measurements. Built for enterprise risk intelligence.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">CISO Login</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">CFO Login</Link>
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main className="bg-background text-foreground">
        <Hero />
        <Stats />
        <HowItWorks />
        <DualPersonas />
        <RiskGraph />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
