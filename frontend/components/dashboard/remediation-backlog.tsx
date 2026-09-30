"use client"

import { useState } from "react"
import { MOCK_REMEDIATIONS } from "@/lib/mock-data"
import { ArrowUpDown, HelpCircle, ShieldAlert, Zap } from "lucide-react"

export function RemediationBacklog({ data }: { data?: any[] }) {
  const [sortBy, setSortBy] = useState<"roi" | "riskReduction" | "cost">("roi")
  
  const hasRealData = data && data.length > 0;
  
  // Map real data or fallback to mock
  const items = hasRealData ? data!.map((d, i) => ({
    id: d.id || i,
    action: d.name,
    owner: "SecOps",
    deadline: "ASAP",
    asset: d.asset_id,
    risk: "High", // Fallback for UI visualization
    cost: d.cost_lakhs * 100000,
    riskReduction: d.risk_reduction_lakhs * 100000,
    currentLoss: 0,
    roi: d.risk_reduction_per_lakh,
    status: "Open"
  })) : MOCK_REMEDIATIONS;

  const sorted = [...items].sort((a, b) => {
    if (sortBy === "roi") return b.roi - a.roi
    if (sortBy === "riskReduction") return b.riskReduction - a.riskReduction
    return a.cost - b.cost
  })

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    return `₹${(val / 1000).toFixed(0)}K`
  }

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col">
      <div className="p-5 border-b border-border/50 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">Remediation Backlog</h2>
            {!hasRealData && <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">DEMO DATA</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Prioritized by financial risk reduction per unit of remediation effort.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Sort by:</span>
          <select 
            className="text-xs bg-background border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="roi">Highest ROI</option>
            <option value="riskReduction">Max Risk Reduction</option>
            <option value="cost">Lowest Cost</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left data-table">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Action</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Asset / Risk</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-right">Cost</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-emerald-500 font-semibold text-right">Risk Reduction</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-primary font-semibold text-right">ROI</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors group">
                <td className="px-5 py-3 max-w-[200px]">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer truncate" title={item.action}>{item.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Owner: {item.owner} • Due {item.deadline}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium">{item.asset}</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${item.risk === 'Critical' ? 'bg-rose-500/10 text-rose-500' : item.risk === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {item.risk}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <p className="text-sm font-mono">{formatCurrency(item.cost)}</p>
                </td>
                <td className="px-5 py-3 text-right">
                  <p className="text-sm font-bold font-mono text-emerald-500">-{formatCurrency(item.riskReduction)}</p>
                  <p className="text-[10px] text-muted-foreground">Current: {formatCurrency(item.currentLoss)}</p>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
                    {item.roi.toFixed(1)}x
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'Completed' ? 'text-emerald-500' : item.status === 'In Progress' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          Don't fix the highest CVSS. Fix the issue that reduces the most business risk per unit of effort.
        </p>
        <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          View all {sorted.length} actions
        </button>
      </div>
    </div>
  )
}
