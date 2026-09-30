"use client"

import { CheckSquare, AlertTriangle, Clock } from "lucide-react"

const frameworks = [
  { name: "SOC 2 Type II", controls: 142, compliant: 118, score: 83, status: "In Progress" },
  { name: "ISO 27001", controls: 114, compliant: 91, score: 80, status: "Certified" },
  { name: "NIST CSF", controls: 108, compliant: 76, score: 70, status: "In Progress" },
  { name: "PCI DSS v4", controls: 89, compliant: 58, score: 65, status: "Gap Analysis" },
  { name: "GDPR", controls: 56, compliant: 48, score: 86, status: "Compliant" },
]

const upcomingAudits = [
  { audit: "SOC 2 Annual Audit", date: "2026-11-15", auditor: "Deloitte", status: "Scheduled" },
  { audit: "PCI DSS QSA Assessment", date: "2026-10-20", auditor: "SecurityMetrics", status: "Prep" },
  { audit: "ISO 27001 Surveillance", date: "2026-12-05", auditor: "BSI Group", status: "Scheduled" },
]

export default function CompliancePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Framework compliance status · Demo data</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((f) => (
          <div key={f.name} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{f.name}</h3>
              <span className={`info-chip border text-[11px] font-semibold ${
                f.status === "Certified" || f.status === "Compliant"
                  ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                  : "text-amber-600 bg-amber-500/10 border-amber-500/20"
              }`}>{f.status}</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className={`text-4xl font-black ${f.score >= 80 ? "text-accent" : f.score >= 70 ? "text-amber-500" : "text-rose-500"}`}>
                {f.score}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${f.score}%`,
                  backgroundColor: f.score >= 80 ? "#0CA678" : f.score >= 70 ? "#F59E0B" : "#F43F5E",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {f.compliant} of {f.controls} controls compliant
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="font-semibold">Upcoming Audits</h2></div>
        <table className="w-full data-table">
          <thead>
            <tr><th>Audit</th><th>Date</th><th>Auditor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {upcomingAudits.map((a) => (
              <tr key={a.audit}>
                <td className="font-medium text-sm">{a.audit}</td>
                <td className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{a.date}</td>
                <td className="text-xs text-muted-foreground">{a.auditor}</td>
                <td>
                  <span className={`info-chip border text-[11px] font-medium ${
                    a.status === "Scheduled" ? "text-primary bg-primary/10 border-primary/20" : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                  }`}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
