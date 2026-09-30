"use client"

import { MOCK_TIMELINE } from "@/lib/mock-data"
import { AlertCircle, AlertTriangle, CheckCircle2, Search, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react"

export function RiskTimeline() {
  
  const getIcon = (status: string) => {
    switch (status) {
      case "Detection": return <Search className="w-4 h-4 text-sky-500" />
      case "Analysis": return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "Risk Increase": return <TrendingUp className="w-4 h-4 text-rose-500" />
      case "Remediation": return <ShieldCheck className="w-4 h-4 text-primary" />
      case "Risk Reduction": return <TrendingDown className="w-4 h-4 text-emerald-500" />
      default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case "Detection": return "border-sky-500/30"
      case "Analysis": return "border-amber-500/30"
      case "Risk Increase": return "border-rose-500/30"
      case "Remediation": return "border-primary/30"
      case "Risk Reduction": return "border-emerald-500/30"
      default: return "border-border"
    }
  }

  const getBgColor = (status: string) => {
    switch (status) {
      case "Detection": return "bg-sky-500/10"
      case "Analysis": return "bg-amber-500/10"
      case "Risk Increase": return "bg-rose-500/10"
      case "Remediation": return "bg-primary/10"
      case "Risk Reduction": return "bg-emerald-500/10"
      default: return "bg-muted"
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="font-semibold text-lg">Risk Event Timeline</h2>
        <p className="text-xs text-muted-foreground mt-1">Chronological evolution of CVE-2026-8192.</p>
      </div>
      
      <div className="relative flex-1 overflow-y-auto pr-2">
        {/* Continuous timeline line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border/50" />
        
        <div className="space-y-6">
          {MOCK_TIMELINE.map((item, idx) => (
            <div key={item.id} className="relative flex gap-4 cursor-pointer group">
              <div className="flex flex-col items-center pt-0.5">
                <div className={`w-14 text-[10px] font-mono font-bold text-muted-foreground text-right mr-2 mt-1 transition-colors group-hover:text-foreground`}>
                  {item.time}
                </div>
              </div>
              
              <div className={`w-8 h-8 rounded-full border ${getBorderColor(item.status)} ${getBgColor(item.status)} flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-transform group-hover:scale-110`}>
                {getIcon(item.status)}
              </div>
              
              <div className="flex-1 pb-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.event}</p>
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Asset: <span className="font-medium text-foreground">{item.asset}</span></p>
                  <p className="text-xs text-slate-400 font-editorial">{item.change}</p>
                  
                  {item.financialImpact && (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 mt-2 rounded border text-xs font-bold font-mono ${item.status === 'Risk Increase' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {item.financialImpact}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
