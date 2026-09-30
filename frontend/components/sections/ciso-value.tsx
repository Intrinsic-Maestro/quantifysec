"use client"

import { Eye, Zap, Target, ListChecks } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Eye,
    title: "What is happening?",
    description: "Real-time threat activity, open incidents, and asset health in one unified view.",
  },
  {
    icon: Target,
    title: "What is dangerous?",
    description: "Risk-ranked vulnerabilities with severity scoring, affected assets, and exploitability data.",
  },
  {
    icon: Zap,
    title: "Why does it matter?",
    description: "Every risk maps to business impact — potential downtime, data exposure, regulatory penalties.",
  },
  {
    icon: ListChecks,
    title: "What should I do?",
    description: "Prioritized remediation actions with effort estimates, owner assignment, and tracking.",
  },
]

export default function CISOValue() {
  return (
    <section className="relative py-24 px-4 bg-muted/30" id="ciso">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <p className="section-label">For CISOs</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance mt-2">
                Security Intelligence
                <br />
                <span className="gradient-text">That Answers the Right Questions</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mt-5">
                Stop drowning in alerts. QuantifySec gives you a clear security narrative — from individual CVEs
                to board-ready risk summaries — all in one place.
              </p>
            </div>

            <Link href="/dashboard/ciso">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Explore CISO Dashboard →
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-card rounded-xl border border-border p-6 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
