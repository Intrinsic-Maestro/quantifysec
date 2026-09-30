"use client"

import Link from "next/link"
import { ArrowRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FinalCTA() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Stop Guessing.
            <br />
            <span className="gradient-text">Start Quantifying.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join security teams that use QuantifySec to turn complex cybersecurity data into
            clear business risk intelligence — and make every security decision with confidence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-10 gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard/ciso">
            <Button size="lg" variant="outline" className="font-semibold px-10">
              Explore Demo Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
          {[
            "No credit card required",
            "14-day free trial",
            "SOC 2 Type II certified",
            "Cancel anytime",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-accent inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
