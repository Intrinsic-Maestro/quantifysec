"use client"

import { Shield, TrendingDown } from "lucide-react"

const postureItems = [
  { category: "Endpoint Security", score: 91, status: "Strong" },
  { category: "Network Security", score: 78, status: "Moderate" },
  { category: "Cloud Security", score: 65, status: "At Risk" },
  { category: "Identity & Access", score: 83, status: "Good" },
  { category: "Data Protection", score: 72, status: "Moderate" },
  { category: "Application Security", score: 58, status: "At Risk" },
]

function getColor(score: number) {
  if (score >= 85) return { text: "text-accent", bg: "bg-accent", badge: "text-accent bg-accent/10 border-accent/20" }
  if (score >= 70) return { text: "text-amber-500", bg: "bg-amber-500", badge: "text-amber-600 bg-amber-500/10 border-amber-500/20" }
  return { text: "text-rose-500", bg: "bg-rose-500", badge: "text-rose-500 bg-rose-500/10 border-rose-500/20" }
}

export default function SecurityPosture() {
  return (
    <section className="relative py-24 px-4" id="security-posture">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-6">
            <p className="section-label">Security Posture</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              See Your Entire Security
              <br />
              <span className="gradient-text">At a Glance</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              QuantifySec maps your security across six critical domains and gives each a measurable score.
              Know exactly where you're strong, where you're exposed, and what to fix first.
            </p>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/15">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Overall Security Score: 74/100</p>
                <p className="text-xs text-muted-foreground">Improved +8 points from last quarter</p>
              </div>
            </div>
          </div>

          {/* Right — Posture Breakdown */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Security Domain Breakdown</h3>
              <span className="text-xs text-muted-foreground">Demo Data</span>
            </div>

            {postureItems.map((item) => {
              const colors = getColor(item.score)
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                        {item.status}
                      </span>
                      <span className={`text-sm font-bold ${colors.text}`}>{item.score}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bg} transition-all duration-700`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
