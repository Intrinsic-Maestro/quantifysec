"use client"

import { TrendingUp, AlertTriangle, DollarSign } from "lucide-react"

const problems = [
  {
    icon: TrendingUp,
    stat: "1 attack every 39 seconds",
    description: "The global threat landscape grows exponentially. Your team cannot manually track every vector.",
    color: "text-rose-500",
    bg: "bg-rose-500/8",
    border: "border-rose-500/15",
  },
  {
    icon: AlertTriangle,
    stat: "Security tools speak a language CEOs don't",
    description: "CVEs, CVSS scores, and attack vectors mean nothing to a CFO approving a $5M security budget.",
    color: "text-amber-500",
    bg: "bg-amber-500/8",
    border: "border-amber-500/15",
  },
  {
    icon: DollarSign,
    stat: "$4.88M average data breach cost in 2024",
    description: "Without quantified risk, organizations consistently under-invest — until it's too late.",
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/15",
  },
]

export default function Problem() {
  return (
    <section className="relative py-24 px-4" id="problem">
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="text-center mb-16 space-y-4">
          <p className="section-label">The Problem</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Security Data Without Context
            <br />
            <span className="text-muted-foreground font-normal">Is Just Noise</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your security team has dashboards full of alerts. Your executives have no idea what any of it means.
            The gap between technical data and business decisions is costing companies millions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.stat}
                className={`rounded-xl border ${p.border} ${p.bg} p-8 transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className={`w-10 h-10 rounded-lg ${p.bg} border ${p.border} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${p.color}`}>{p.stat}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
