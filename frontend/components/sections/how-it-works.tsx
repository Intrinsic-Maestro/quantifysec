"use client"

import { Database, Cpu, BarChart3, ArrowRight } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Database,
    title: "Connect Your Security Stack",
    description:
      "Integrate with your existing tools — SIEMs, vulnerability scanners, cloud platforms, endpoint agents. QuantifySec ingests data from 100+ sources.",
    tags: ["SIEM", "CSPM", "EDR", "Cloud APIs"],
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes & Quantifies Risk",
    description:
      "Our AI engine correlates threat intelligence with your asset inventory, assigns risk scores, and calculates potential financial impact using industry-standard methodologies.",
    tags: ["FAIR Model", "CVE Mapping", "Asset Criticality", "Threat Intel"],
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Actionable Intelligence, Not Raw Data",
    description:
      "CISOs get prioritized risk queues with technical evidence. CFOs get financial impact dashboards. Both get clear recommendations.",
    tags: ["CISO View", "CFO View", "Executive Reports", "Remediation Plans"],
  },
]

export default function HowItWorks() {
  return (
    <section className="relative py-24 px-4 bg-muted/30" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="section-label">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            From Raw Data to{" "}
            <span className="gradient-text">Business Intelligence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three steps to turn your security stack into measurable risk intelligence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector lines (desktop only) */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.step} className="relative bg-card rounded-2xl border border-border p-8 hover:shadow-md transition-shadow">
                {/* Step number */}
                <div className="text-5xl font-black text-muted/30 absolute top-5 right-6 select-none">
                  {step.step}
                </div>

                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{step.description}</p>

                <div className="flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-5 top-14 z-10 w-10 h-10 rounded-full bg-background border border-border items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
