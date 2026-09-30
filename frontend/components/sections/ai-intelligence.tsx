"use client"

import { Brain, MessageSquare, Lightbulb } from "lucide-react"

const insights = [
  {
    question: "What are our biggest risks this week?",
    answer:
      "3 critical risks identified: (1) Unpatched CVE-2024-3400 on API gateway — 9.1/10 severity, $1.2M exposure. (2) Over-privileged service accounts in production — 7.8/10. (3) Public S3 bucket with customer PII — 7.2/10. Recommend immediate patching of CVE-2024-3400.",
    confidence: 97,
  },
  {
    question: "How has our security posture changed this month?",
    answer:
      "Overall score improved from 71 to 74 (+4.2%). Cloud security is the weakest domain at 65/100, down from 68 last month due to 4 new misconfigurations in AWS. Endpoint security remains strong at 91/100.",
    confidence: 94,
  },
]

export default function AIIntelligence() {
  return (
    <section className="relative py-24 px-4 bg-muted/30" id="ai">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="section-label">AI Security Intelligence</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Ask Anything About
            <br />
            <span className="gradient-text">Your Security Posture</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The AI Security Analyst synthesizes your entire security dataset and answers questions
            in plain language — so every stakeholder gets the clarity they need.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Chat Preview */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI Security Analyst</p>
                <p className="text-xs text-muted-foreground">Powered by QuantifySec Intelligence Engine</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-accent font-medium">
                <span className="live-dot" />
                Online
              </div>
            </div>

            <div className="p-6 space-y-6">
              {insights.map((insight, i) => (
                <div key={i} className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="ai-message-user max-w-[70%]">
                      <p className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                        {insight.question}
                      </p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="ai-message-assistant">
                      <p className="leading-relaxed">{insight.answer}</p>
                      <p className="text-xs text-muted-foreground mt-2 opacity-70">
                        Confidence: {insight.confidence}% · Based on live data
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Input area */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 border border-border">
                  <input
                    type="text"
                    placeholder="Ask about your security posture, risks, compliance..."
                    className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/60 outline-none"
                    readOnly
                  />
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Demo mode — connect to your data for live AI analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
