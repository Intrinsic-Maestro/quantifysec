"use client"

import { Flame, Clock, User, ChevronRight } from "lucide-react"

import { USERS } from "@/lib/users"

const incidents = [
  { id: "INC-0292", title: "Ransomware alert — endpoint isolation triggered", severity: "Critical", assigned: USERS.ANALYST_1.name, opened: "1h ago", status: "Investigating" },
  { id: "INC-0291", title: "Suspicious login from unknown IP — 45.33.32.156", severity: "High", assigned: USERS.ANALYST_2.name, opened: "2h ago", status: "Investigating" },
  { id: "INC-0290", title: "Brute force attempt on VPN gateway", severity: "Medium", assigned: USERS.ANALYST_2.name, opened: "5h ago", status: "Resolved" },
  { id: "INC-0289", title: "Malware signature detected on ACME-LAPTOP-0192", severity: "Critical", assigned: USERS.ANALYST_1.name, opened: "8h ago", status: "Contained" },
  { id: "INC-0288", title: "Anomalous data exfiltration pattern in S3 logs", severity: "High", assigned: USERS.CISO.name, opened: "1d ago", status: "Resolved" },
  { id: "INC-0287", title: "Privilege escalation attempt detected", severity: "High", assigned: USERS.ANALYST_1.name, opened: "2d ago", status: "Resolved" },
]

function SevBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[s]}`}>{s}</span>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Investigating: "text-primary bg-primary/10 border-primary/20",
    Contained: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Resolved: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-medium text-[11px] ${m[s]}`}>{s}</span>
}

export default function IncidentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Security incident tracking and response · Demo data</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Flame className="w-4 h-4" />
          New Incident
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: "3", color: "text-rose-500" },
          { label: "Investigating", value: "2", color: "text-primary" },
          { label: "Resolved Today", value: "7", color: "text-accent" },
          { label: "MTTR", value: "4.2h", color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="font-semibold">Incident Register</h2></div>
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Assigned</th>
              <th>Opened</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id} className="cursor-pointer">
                <td><code className="text-xs font-mono text-muted-foreground">{inc.id}</code></td>
                <td className="max-w-[300px]"><p className="text-sm font-medium truncate">{inc.title}</p></td>
                <td><SevBadge s={inc.severity} /></td>
                <td>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />{inc.assigned}
                  </span>
                </td>
                <td className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{inc.opened}</td>
                <td><StatusBadge s={inc.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
