"use client"

import { Flame, AlertTriangle, Clock, ChevronRight } from "lucide-react"

const threats = [
  { id: "THR-0441", name: "Credential Stuffing Campaign", source: "Russian APT Group", target: "VPN Gateway", severity: "Critical", detected: "2h ago", status: "Active" },
  { id: "THR-0440", name: "Phishing Campaign — Finance Team", source: "Unknown", target: "Email / Finance Dept", severity: "High", detected: "5h ago", status: "Contained" },
  { id: "THR-0439", name: "Log4Shell exploitation attempt", source: "Automated Scanner", target: "Legacy App Server", severity: "Critical", detected: "8h ago", status: "Blocked" },
  { id: "THR-0438", name: "Brute Force on SSH Port 22", source: "Botnet", target: "203.0.113.45", severity: "Medium", detected: "12h ago", status: "Blocked" },
  { id: "THR-0437", name: "Lateral movement detected", source: "Internal host", target: "Database Servers", severity: "High", detected: "1d ago", status: "Investigating" },
  { id: "THR-0436", name: "Data exfiltration pattern", source: "Insider", target: "S3 Buckets", severity: "High", detected: "1d ago", status: "Resolved" },
]

function SeverityBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[s]}`}>{s}</span>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Active: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    Investigating: "text-primary bg-primary/10 border-primary/20",
    Contained: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Blocked: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    Resolved: "text-muted-foreground bg-muted border-border",
  }
  return <span className={`info-chip border font-medium text-[11px] ${m[s]}`}>{s}</span>
}

export default function ThreatsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Threats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Active and recent threat detections · Demo data</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-rose-500 font-semibold px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
          <Flame className="w-3.5 h-3.5" />
          14 Active Threats
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: "2", color: "text-rose-500" },
          { label: "High", value: "5", color: "text-orange-500" },
          { label: "Medium", value: "7", color: "text-amber-500" },
          { label: "Blocked Today", value: "318", color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Threat Activity Feed</h2>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Threat</th>
              <th>Source</th>
              <th>Target</th>
              <th>Severity</th>
              <th>Detected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {threats.map((t) => (
              <tr key={t.id} className="cursor-pointer">
                <td><code className="text-xs font-mono text-muted-foreground">{t.id}</code></td>
                <td className="max-w-[200px]"><p className="text-sm font-medium truncate">{t.name}</p></td>
                <td className="text-xs text-muted-foreground">{t.source}</td>
                <td className="text-xs font-mono text-muted-foreground">{t.target}</td>
                <td><SeverityBadge s={t.severity} /></td>
                <td className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{t.detected}</td>
                <td><StatusBadge s={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
