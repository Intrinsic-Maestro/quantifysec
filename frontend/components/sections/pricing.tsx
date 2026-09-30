"use client"

import { Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: null,
    description: "For small security teams getting started with risk quantification.",
    features: [
      "Up to 100 assets",
      "Security Score dashboard",
      "Basic risk scoring",
      "5 integrations",
      "Community support",
    ],
    highlighted: false,
    cta: "Start Free",
    href: "/signup",
  },
  {
    name: "Professional",
    price: "$499",
    period: "/month",
    description: "Full risk intelligence for growing security programs.",
    features: [
      "Up to 2,000 assets",
      "CISO + CFO dashboards",
      "Financial risk quantification",
      "AI Security Analyst",
      "Attack surface monitoring",
      "50+ integrations",
      "Audit logs",
      "Priority support",
    ],
    highlighted: true,
    badge: "Most Popular",
    cta: "Start 14-Day Trial",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: null,
    description: "Unlimited intelligence for large security organizations.",
    features: [
      "Unlimited assets",
      "Custom risk models",
      "Board-ready reporting",
      "Dedicated AI training",
      "SSO & SCIM",
      "Custom integrations",
      "99.9% SLA",
      "Dedicated CSM",
    ],
    highlighted: false,
    cta: "Contact Sales",
    href: "/contact",
  },
]

export default function Pricing() {
  return (
    <section className="relative py-24 px-4 bg-muted/30" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="section-label">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Scale your security intelligence as your organization grows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col transition-shadow hover:shadow-md ${
                plan.highlighted
                  ? "bg-primary border-2 border-primary text-white shadow-lg shadow-primary/20"
                  : "bg-card border border-border"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-white" : ""}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  <span className={`text-4xl font-black ${plan.highlighted ? "text-white" : ""}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm font-medium ml-1 ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlighted ? "text-white" : "text-primary"}`} />
                      </div>
                      <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-muted-foreground"}`}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href={plan.href}>
                <Button
                  className={`w-full font-semibold ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
