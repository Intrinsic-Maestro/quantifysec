"use client"

import { useState, useRef, useEffect } from "react"
import { Brain, X, Send, Sparkles, AlertCircle, TrendingUp, Search, Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [history, setHistory] = useState<Message[]>([
    { role: "assistant", content: "Hello. I am the QuantifySec AI Security Analyst. How can I assist with your risk intelligence today?" }
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const pathname = usePathname()
  const isCfo = pathname.startsWith("/dashboard/cfo")
  const role = isCfo ? "CFO" : pathname.startsWith("/dashboard/ciso") ? "CISO" : "VIEWER"

  const suggestedPrompts = isCfo 
    ? ["What is our current cyber risk exposure?", "How effective is our security investment?", "Summarize our security posture for executives."]
    : ["What are my biggest risks?", "What did the latest OCSF ingestion discover?", "Show me critical findings."]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history, isStreaming])

  const getPageContext = () => {
    if (pathname.includes("/security-posture")) {
      return { page: "Security Posture", score: 92, status: "Strong", recentChanges: "+2" }
    }
    if (pathname.includes("/incidents")) {
      return { page: "Incidents", openCritical: 2, total: 7, mttr: "4.2h" }
    }
    if (pathname.includes("/ocsf")) {
      return { page: "OCSF Import", lastImport: "18,429 events", rejected: 17, criticalFindings: 12 }
    }
    return { page: pathname, generalInfo: "QuantifySec dashboard" }
  }

  const handleSend = async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault()
    
    const textToSend = overrideMsg || message
    if (!textToSend.trim() || isStreaming) return

    const newHistory: Message[] = [...history, { role: "user", content: textToSend }]
    setHistory(newHistory)
    setMessage("")
    setError(null)
    setIsStreaming(true)

    setHistory(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          role,
          context: getPageContext()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: Failed to communicate with AI`)
      }

      if (!response.body) throw new Error("No response stream")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantMessage += chunk

        setHistory(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantMessage }
          return updated
        })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "QuantifySec AI is temporarily unavailable. Please try again.")
      setHistory(prev => {
        const updated = [...prev]
        if (updated[updated.length - 1].content === "") {
          updated.pop()
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all animate-slide-up group"
          style={{
            backgroundColor: 'var(--qs-green)',
            color: '#000000',
            boxShadow: '0 8px 30px rgba(0,200,120,0.35)'
          }}
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold text-sm">QuantifySec AI</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-full md:w-[420px] h-[85vh] md:h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--qs-green-dim)', border: '1px solid var(--qs-green-border)' }}>
                <Brain className="w-4 h-4" style={{ color: 'var(--qs-green)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>QuantifySec AI Analyst</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'var(--qs-green)' }} />
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    {isStreaming ? 'Analyzing...' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors" style={{ color: 'var(--muted-foreground)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 dashboard-scroll">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-sm font-medium'
                      : 'rounded-bl-sm leading-relaxed border whitespace-pre-wrap'
                  }`}
                  style={msg.role === 'user'
                    ? { backgroundColor: 'var(--qs-green)', color: '#000000', borderColor: 'transparent' }
                    : { backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isStreaming && history[history.length - 1].role === 'user' && (
               <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm border flex items-center gap-2"
                       style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--qs-green)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Analyzing security data...</span>
                  </div>
               </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="px-3 py-2 rounded-lg border text-xs flex items-start gap-2"
                     style={{ backgroundColor: 'rgba(255,59,48,0.08)', borderColor: 'rgba(255,59,48,0.2)', color: 'var(--qs-red)' }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {history.length < 3 && !isStreaming && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto dashboard-scroll whitespace-nowrap">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(undefined, prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border flex-shrink-0 transition-colors"
                  style={{
                    borderColor: 'var(--qs-green-border)',
                    backgroundColor: 'var(--qs-green-dim)',
                    color: 'var(--qs-green)'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
            <form onSubmit={(e) => handleSend(e)} className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask QuantifySec AI Analyst..."
                disabled={isStreaming}
                className="w-full rounded-full pl-9 pr-10 py-2 text-sm outline-none transition-shadow disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                type="submit"
                className="absolute right-1.5 p-1.5 rounded-full transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: message.trim() && !isStreaming ? 'var(--qs-green)' : 'var(--muted)',
                  color: message.trim() && !isStreaming ? '#000000' : 'var(--muted-foreground)'
                }}
                disabled={!message.trim() || isStreaming}
              >
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-2">
                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  AI can make mistakes. Verify critical security findings.
                </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
