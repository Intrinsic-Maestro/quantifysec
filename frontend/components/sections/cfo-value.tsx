"use client"

import { DollarSign, TrendingUp, PieChart, BarChart2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const metrics = [
  { label: "Total Risk Exposure", value: "$4.2M", change: "-12% vs Q3", up: false },
  { label: "Security Investment", value: "$840K", change: "Annual budget", up: null },
  { label: "Estimated Risk Reduction", value: "68%", change: "+5% this quarter", up: true },
  { label: "Security ROI", value: "4.2x", change: "Per dollar invested", up: true },
]

export default function CFOValue() {
  return (
    <section className="relative py-24 px-4" id="cfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — CFO Metrics Preview */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-semibold text-sm">CFO Risk Summary — Q4 2025</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">Demo Data</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {metrics.map((m) => (
                  <div key={m.label} className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    <p className={`text-xs mt-1 font-medium ${
                      m.up === true ? "text-accent" : m.up === false ? "text-rose-500" : "text-muted-foreground"
                    }`}>
                      {m.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Risk Breakdown Bar */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Budget Allocation</p>
                <div className="flex rounded-full overflow-hidden h-3">
                  <div className="bg-rose-500 h-full" style={{ width: "28%" }} title="Critical" />
                  <div className="bg-amber-500 h-full" style={{ width: "35%" }} title="High" />
                  <div className="bg-yellow-400 h-full" style={{ width: "22%" }} title="Medium" />
                  <div className="bg-accent h-full" style={{ width: "15%" }} title="Low" />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {[
                    { label: "Critical", color: "bg-rose-500", pct: "28%" },
                    { label: "High", color: "bg-amber-500", pct: "35%" },
                    { label: "Medium", color: "bg-yellow-400", pct: "22%" },
                    { label: "Low", color: "bg-accent", pct: "15%" },
                  ].map((b) => (
                    <span key={b.label} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${b.color}`} />
                      {b.label} {b.pct}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Value Prop */}
          <div className="space-y-8">
            <div>
              <p className="section-label">For CFOs</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance mt-2">
                Cybersecurity in
                <br />
                <span className="gradient-text">Financial Language</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mt-5">
                Stop approving security budgets on faith. QuantifySec translates every technical risk into
                dollar-denominated exposure, ROI projections, and residual risk estimates.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { q: "How much cyber risk do we have?", a: "Total exposure in dollars, by business unit and risk category." },
                { q: "What could a breach actually cost?", a: "Probability-weighted financial impact for each risk scenario." },
                { q: "Is our security spend working?", a: "ROI dashboard showing risk reduction per dollar invested." },
              ].map((item) => (
                <div key={item.q} className="p-4 rounded-xl bg-card border border-border">
                  <p className="font-semibold text-sm mb-1">{item.q}</p>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>

            <Link href="/dashboard/cfo">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Explore CFO Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
