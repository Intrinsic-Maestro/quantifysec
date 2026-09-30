"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"
import { Shield, TrendingUp, ChevronRight } from "lucide-react"
import Link from "next/link"

const domains = [
  { domain: "Endpoint", score: 91, benchmark: 78 },
  { domain: "Network", score: 78, benchmark: 72 },
  { domain: "Cloud", score: 65, benchmark: 68 },
  { domain: "Identity", score: 83, benchmark: 75 },
  { domain: "Data", score: 72, benchmark: 70 },
  { domain: "App Sec", score: 58, benchmark: 65 },
]

const controlStatus = [
  { control: "CC6.1 — Logical Access Controls", framework: "SOC 2", status: "Compliant", score: 91 },
  { control: "AC-2 — Account Management", framework: "NIST 800-53", status: "Partial", score: 72 },
  { control: "PR.AC-4 — Access Permissions", framework: "NIST CSF", status: "Compliant", score: 88 },
  { control: "CIS Control 5 — Account Management", framework: "CIS v8", status: "Non-Compliant", score: 54 },
  { control: "CC7.2 — System Monitoring", framework: "SOC 2", status: "Compliant", score: 85 },
  { control: "DE.CM-1 — Network Monitoring", framework: "NIST CSF", status: "Compliant", score: 82 },
]

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Compliant: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    Partial: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    "Non-Compliant": "text-rose-500 bg-rose-500/10 border-rose-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[s]}`}>{s}</span>
}

export default function SecurityPosturePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Security Posture</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comprehensive security posture analysis · Demo data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Score", value: "74/100", color: "text-amber-500", sub: "Moderate" },
          { label: "Industry Rank", value: "Top 32%", color: "text-primary", sub: "Financial services" },
          { label: "Controls Compliant", value: "68%", color: "text-accent", sub: "of 142 controls" },
          { label: "Score Trend", value: "+4.2%", color: "text-accent", sub: "vs last month" },
        ].map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Domain Score Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={domains}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: "var(--foreground)" }} />
              <Radar name="Your Score" dataKey="score" stroke="#3B5BDB" fill="#3B5BDB" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Industry Avg" dataKey="benchmark" stroke="#0CA678" fill="#0CA678" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 3" />
              <Tooltip formatter={(v) => [`${v}/100`]} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center text-xs mt-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3 h-0.5 bg-primary inline-block rounded" /> Your Score
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-3 h-0.5 bg-accent inline-block rounded" style={{ borderTop: "1px dashed" }} /> Industry Avg
            </span>
          </div>
        </div>

        {/* Domain Scores */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Domain Breakdown</h2>
          <div className="space-y-4">
            {domains.map((d) => {
              const color = d.score >= 80 ? "#0CA678" : d.score >= 65 ? "#F59E0B" : "#F43F5E"
              return (
                <div key={d.domain} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{d.domain}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Benchmark: {d.benchmark}</span>
                      <span className="font-bold" style={{ color }}>{d.score}/100</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Controls Status */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Security Control Status</h2>
          <Link href="/dashboard/ciso/compliance" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            Full Compliance View <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Framework</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {controlStatus.map((c) => (
              <tr key={c.control}>
                <td className="font-medium text-sm max-w-[300px]">
                  <p className="truncate">{c.control}</p>
                </td>
                <td>
                  <span className="text-xs font-medium text-muted-foreground">{c.framework}</span>
                </td>
                <td><StatusBadge s={c.status} /></td>
                <td>
                  <span className={`font-bold text-sm ${c.score >= 80 ? "text-accent" : c.score >= 65 ? "text-amber-500" : "text-rose-500"}`}>
                    {c.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
