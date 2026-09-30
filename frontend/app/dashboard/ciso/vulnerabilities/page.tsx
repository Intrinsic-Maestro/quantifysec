"use client"

import { Bug, Filter } from "lucide-react"
import { useState } from "react"

const vulns = [
  { id: "CVE-2024-3400", asset: "prod-api-gateway", cvss: 10.0, severity: "Critical", published: "2024-04-12", patch: "Available", status: "Open" },
  { id: "CVE-2024-21413", asset: "exchange-server-01", cvss: 9.8, severity: "Critical", published: "2024-02-13", patch: "Available", status: "Open" },
  { id: "CVE-2023-44487", asset: "nginx-lb-prod", cvss: 7.5, severity: "High", published: "2023-10-10", patch: "Available", status: "In Progress" },
  { id: "CVE-2024-1234", asset: "legacy-portal", cvss: 7.1, severity: "High", published: "2024-03-05", patch: "Available", status: "Open" },
  { id: "CVE-2023-5678", asset: "webapp-api", cvss: 6.5, severity: "Medium", published: "2023-11-20", patch: "Partial", status: "Open" },
  { id: "CVE-2024-9012", asset: "kubernetes-cluster", cvss: 6.2, severity: "Medium", published: "2024-01-15", patch: "Available", status: "In Progress" },
  { id: "CVE-2023-2468", asset: "jenkins-ci", cvss: 5.8, severity: "Medium", published: "2023-09-08", patch: "Available", status: "Resolved" },
]

function SevBadge({ s, score }: { s: string; score: number }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Low: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[s]}`}>{s} {score}</span>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Open: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    "In Progress": "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Resolved: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-medium text-[11px] ${m[s]}`}>{s}</span>
}

export default function VulnerabilitiesPage() {
  const [filter, setFilter] = useState("All")
  const filtered = filter === "All" ? vulns : vulns.filter((v) => v.severity === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Vulnerabilities</h1>
        <p className="text-sm text-muted-foreground mt-0.5">CVE tracking and patch status · Demo data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: "2", color: "text-rose-500" },
          { label: "High", value: "8", color: "text-orange-500" },
          { label: "Medium", value: "19", color: "text-amber-500" },
          { label: "Patch Available", value: "74%", color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {["All", "Critical", "High", "Medium"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">CVE Register ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>CVE ID</th>
                <th>Asset</th>
                <th>CVSS / Severity</th>
                <th>Published</th>
                <th>Patch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td><code className="text-xs font-mono text-primary">{v.id}</code></td>
                  <td className="font-mono text-xs">{v.asset}</td>
                  <td><SevBadge s={v.severity} score={v.cvss} /></td>
                  <td className="text-xs text-muted-foreground">{v.published}</td>
                  <td>
                    <span className={`text-xs font-medium ${v.patch === "Available" ? "text-accent" : "text-amber-500"}`}>
                      {v.patch}
                    </span>
                  </td>
                  <td><StatusBadge s={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
