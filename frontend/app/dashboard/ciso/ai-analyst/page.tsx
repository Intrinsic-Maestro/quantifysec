"use client"

import { useState, useRef, useEffect } from "react"
import { Brain, Send, Sparkles, Clock, ThumbsUp, ThumbsDown, Copy, RotateCcw } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  assets?: string[]
}

const suggestedQuestions = [
  "What are our biggest risks this week?",
  "Which assets are most vulnerable?",
  "How has our security posture changed this month?",
  "What would reduce our risk exposure the most?",
  "Are we compliant with SOC 2?",
  "What is our estimated breach cost?",
]

const initialMessages: Message[] = [
  {
    id: "init-1",
    role: "assistant",
    content:
      "Hello! I'm your AI Security Analyst. I have full context of your security environment and can help you understand risks, analyze threats, and prioritize actions.\n\nYou can ask me anything about your security posture, specific risks, compliance status, or financial impact — in plain language.",
    timestamp: new Date(),
  },
]

const responses: Record<string, string> = {
  "what are our biggest risks this week": `Based on your current security data, here are your **top 3 risks this week**:

**1. CVE-2024-3400 on API Gateway** — Risk Score: 9.1/10
- Asset: prod-api-gateway (internet-facing)
- Business Impact: Estimated $1.2M exposure if exploited
- Why it matters: This is an actively exploited vulnerability with a public PoC. Your API gateway handles payment processing.
- Recommended Action: Apply vendor patch immediately. Estimated 2-hour maintenance window.

**2. Excessive Admin Privileges on Service Accounts** — Risk Score: 7.8/10
- Asset: AD Domain Controller
- Business Impact: $840K exposure — enables lateral movement if compromised
- Recommended Action: Audit and restrict service account permissions within 48h.

**3. Public S3 Bucket with Customer PII** — Risk Score: 7.2/10
- Asset: s3://acme-customer-data
- Business Impact: $720K + potential GDPR penalties up to $2.1M
- Recommended Action: Set bucket to private immediately. Enable server-side encryption.

**Combined exposure reduction possible: $2.76M if all 3 are remediated this week.**`,

  "how has our security posture changed this month": `Your security posture has **improved from 71 to 74 (+4.2%)** this month.

**Improvements:**
- ✅ Endpoint Security: 88 → 91 (+3) — New EDR deployment complete
- ✅ Identity & Access: 79 → 83 (+4) — MFA rollout finished
- ✅ Incident Response: 65 → 69 (+4) — New IR playbooks implemented

**Regressions:**
- ⚠️ Cloud Security: 68 → 65 (-3) — 4 new misconfigurations in AWS found
- ⚠️ Application Security: 61 → 58 (-3) — 3 new vulnerabilities discovered in API gateway

**Key Recommendation:** Focus remediation on Cloud Security (65/100) and Application Security (58/100). These two domains represent the highest risk density.`,

  default: `I'm analyzing your security data to answer that question.

Based on your current security profile:
- **Security Score:** 87/100 (above industry average of 68)
- **Open Risks:** 94 (3 Critical, 12 High, 31 Medium, 48 Low)
- **Total Risk Exposure:** $4.2M estimated
- **Monitored Assets:** 1,284

The most actionable insight I can offer: your **Cloud Security domain at 65/100** is your weakest area and contributes to approximately 38% of your total risk exposure. Addressing the 4 open cloud misconfigurations would improve your overall score by ~2 points and reduce exposure by an estimated $680K.

Would you like me to dive deeper into any specific area?`,
}

function findResponse(question: string): string {
  const q = question.toLowerCase()
  for (const [key, val] of Object.entries(responses)) {
    if (key !== "default" && q.includes(key.split(" ")[0]) && q.includes(key.split(" ").slice(-1)[0])) {
      return val
    }
  }
  return responses.default
}

export default function AIAnalystPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1400))
    const response = findResponse(text)

    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, aiMsg])
    setLoading(false)
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-bold mt-2">{line.replace(/\*\*/g, "")}</p>
      }
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i} className={i > 0 ? "mt-1" : ""}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        )
      }
      if (line.startsWith("- ") || line.startsWith("✅") || line.startsWith("⚠️")) {
        return <p key={i} className="ml-2 text-sm">{line}</p>
      }
      return line ? <p key={i} className={i > 0 ? "mt-1" : ""}>{line}</p> : <br key={i} />
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">AI Security Analyst</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ask anything about your security posture · Demo mode</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-accent font-medium px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
          <span className="live-dot" />
          AI Engine Online
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Suggested Questions Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 sticky top-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Suggested Questions
            </p>
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden min-h-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Brain className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">QuantifySec AI Analyst</p>
              <p className="text-xs text-muted-foreground">Powered by Security Intelligence Engine</p>
            </div>
            <button
              onClick={() => { setMessages(initialMessages); setInput("") }}
              className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto dashboard-scroll p-5 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === "user" ? "" : ""}`}>
                  <div className={msg.role === "user" ? "ai-message-user" : "ai-message-assistant text-sm leading-relaxed"}>
                    {renderContent(msg.content)}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <button className="p-0.5 hover:text-primary transition-colors text-muted-foreground" title="Copy">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button className="p-0.5 hover:text-accent transition-colors text-muted-foreground" title="Helpful">
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button className="p-0.5 hover:text-rose-500 transition-colors text-muted-foreground" title="Not helpful">
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="ai-message-assistant flex items-center gap-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                        style={{ animation: `livePulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-border">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Ask about your security posture, risks, compliance, financial impact..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition min-h-[48px] max-h-32 dashboard-scroll"
                  rows={1}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Demo mode — responses use fictional security data. Press Enter to send.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
