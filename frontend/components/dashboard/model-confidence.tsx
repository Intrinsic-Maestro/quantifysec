"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, ArrowDown, ShieldAlert, Target, Shield, Calculator, Activity, DollarSign } from "lucide-react"

export function ModelConfidence() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-start hover:bg-muted/50 p-3 -m-3 rounded-lg transition-colors group text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model Confidence</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">76%</p>
          <p className="text-xs text-muted-foreground mt-1">Confidence in current risk quantification</p>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0 overflow-hidden shadow-2xl bg-card border-border/80">
        <div className="p-4 bg-muted/30 border-b border-border/50">
          <h4 className="font-semibold text-sm">Calculation Lineage</h4>
          <p className="text-xs text-muted-foreground mt-1">
            How QuantifySec translates raw security data into financial risk.
          </p>
        </div>
        
        <div className="p-5 space-y-0 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-9 top-8 bottom-8 w-px bg-border/60" />
          
          <div className="relative flex gap-4 pb-5">
            <div className="w-8 h-8 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center flex-shrink-0 z-10">
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Asset</p>
              <p className="font-semibold text-sm">Payment API</p>
              <p className="text-xs text-muted-foreground">CrowdStrike & AWS Inventory</p>
            </div>
          </div>
          
          <div className="relative flex gap-4 pb-5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 z-10">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Criticality & Exposure</p>
              <p className="font-semibold text-sm">Critical • Internet-facing</p>
              <p className="text-xs text-muted-foreground">Revenue dependent: ₹42 Cr</p>
            </div>
          </div>
          
          <div className="relative flex gap-4 pb-5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 z-10">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Threat Probability</p>
              <p className="font-semibold text-sm">High (CVE-2026-8192)</p>
              <p className="text-xs text-muted-foreground">EPSS: 0.91 • Exploit Active</p>
            </div>
          </div>

          <div className="relative flex gap-4 pb-5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 z-10">
              <Calculator className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Monte Carlo Simulation</p>
              <p className="font-semibold text-sm">10,000 Iterations</p>
              <p className="text-xs text-muted-foreground">Log-normal loss distribution</p>
            </div>
          </div>
          
          <div className="relative flex gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 z-10">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Expected Loss</p>
              <p className="font-bold text-lg">₹35L</p>
              <p className="text-xs text-muted-foreground">Confidence level: 76%</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Why 76% confidence?</p>
          <div className="flex gap-2">
            <span className="info-chip text-[10px]">Asset data: 92%</span>
            <span className="info-chip text-[10px]">Threat data: 81%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
