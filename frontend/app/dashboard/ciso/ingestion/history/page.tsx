"use client"

import { useState } from "react"
import {
  ChevronRight, CheckCircle2, AlertTriangle, XCircle, Clock,
  FileJson, Eye, BarChart2, Upload, Filter, Search
} from "lucide-react"

const HISTORY = [
  {
    id: "OCSF-20260927-001",
    filename: "security_events.json",
    uploadedBy: "Alex Johnson (CISO)",
    uploadedAt: "27 Sep 2026 · 16:52",
    events: 18429,
    valid: 18412,
    rejected: 17,
    status: "completed" as const,
    duration: "1m 42s",
    format: "OCSF JSON",
    version: "1.1.0",
    classes: ["Authentication", "Network Activity", "File Activity", "Vulnerability Finding"],
  },
  {
    id: "OCSF-20260926-003",
    filename: "endpoint_telemetry.jsonl",
    uploadedBy: "Sarah Chen (Analyst)",
    uploadedAt: "26 Sep 2026 · 11:14",
    events: 8201,
    valid: 8198,
    rejected: 3,
    status: "completed_warn" as const,
    duration: "48s",
    format: "OCSF JSONL",
    version: "1.0.0",
    classes: ["File Activity", "Process Activity", "Network Activity"],
  },
  {
    id: "OCSF-20260926-002",
    filename: "cloud_audit.json",
    uploadedBy: "Alex Johnson (CISO)",
    uploadedAt: "26 Sep 2026 · 08:33",
    events: 4122,
    valid: 4122,
    rejected: 0,
    status: "completed" as const,
    duration: "22s",
    format: "OCSF JSON",
    version: "1.1.0",
    classes: ["Account Change", "Authentication", "Security Finding"],
  },
  {
    id: "OCSF-20260925-001",
    filename: "firewall_logs_malformed.json",
    uploadedBy: "Ryan Patel (Analyst)",
    uploadedAt: "25 Sep 2026 · 14:07",
    events: 0,
    valid: 0,
    rejected: 0,
    status: "failed" as const,
    duration: "3s",
    format: "Unknown",
    version: "-",
    classes: [],
  },
  {
    id: "OCSF-20260924-002",
    filename: "identity_events.json",
    uploadedBy: "Alex Johnson (CISO)",
    uploadedAt: "24 Sep 2026 · 16:20",
    events: 2847,
    valid: 2847,
    rejected: 0,
    status: "completed" as const,
    duration: "14s",
    format: "OCSF JSON",
    version: "1.1.0",
    classes: ["Authentication", "Account Change", "Group Management"],
  },
]

type Status = "completed" | "completed_warn" | "failed" | "processing"

function StatusBadge({ status }: { status: Status }) {
  const configs: Record<Status, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    completed: {
      label: "Completed",
      color: "var(--qs-green)",
      bg: "var(--qs-green-dim)",
      border: "var(--qs-green-border)",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    completed_warn: {
      label: "Completed with Warnings",
      color: "var(--qs-amber)",
      bg: "rgba(255,176,32,0.1)",
      border: "rgba(255,176,32,0.25)",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    failed: {
      label: "Failed",
      color: "var(--qs-red)",
      bg: "rgba(255,59,48,0.08)",
      border: "rgba(255,59,48,0.25)",
      icon: <XCircle className="w-3 h-3" />,
    },
    processing: {
      label: "Processing",
      color: "var(--qs-cyan)",
      bg: "rgba(0,184,169,0.08)",
      border: "rgba(0,184,169,0.25)",
      icon: <Clock className="w-3 h-3 animate-spin" />,
    },
  }
  const c = configs[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
      {c.icon}{c.label}
    </span>
  )
}

export default function IngestionHistoryPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<typeof HISTORY[0] | null>(null)

  const filtered = HISTORY.filter(h =>
    h.filename.toLowerCase().includes(search.toLowerCase()) ||
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.uploadedBy.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>Security Operations</span>
        <ChevronRight className="w-3 h-3" />
        <span>Data Ingestion</span>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Ingestion History</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>Ingestion History</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            All OCSF data imports — track status, events processed, and quality metrics
          </p>
        </div>
        <a href="/dashboard/ciso/ingestion/ocsf"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
          style={{ backgroundColor: "var(--qs-green)", color: "#000" }}>
          <Upload className="w-4 h-4" />New Import
        </a>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Imports", value: "5", color: "var(--foreground)" },
          { label: "Events Ingested", value: "33,599", color: "var(--qs-green)" },
          { label: "Completed", value: "4", color: "var(--qs-green)" },
          { label: "Failed", value: "1", color: "var(--qs-red)" },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename, ID, or user..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <Filter className="w-4 h-4" />Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Import Log</h2>
          <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Import ID</th>
                <th>Filename</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Events</th>
                <th>Valid</th>
                <th>Rejected</th>
                <th>Duration</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr key={h.id} className="cursor-pointer" onClick={() => setSelected(h)}>
                  <td><code className="text-xs font-mono" style={{ color: "var(--qs-cyan)" }}>{h.id}</code></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileJson className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{h.filename}</span>
                    </div>
                  </td>
                  <td><span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.uploadedBy}</span></td>
                  <td><span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{h.uploadedAt}</span></td>
                  <td><span className="text-sm font-mono font-semibold" style={{ color: "var(--foreground)" }}>{h.events.toLocaleString()}</span></td>
                  <td><span className="text-sm font-mono" style={{ color: "var(--qs-green)" }}>{h.valid.toLocaleString()}</span></td>
                  <td>
                    <span className="text-sm font-mono" style={{ color: h.rejected > 0 ? "var(--qs-amber)" : "var(--muted-foreground)" }}>
                      {h.rejected}
                    </span>
                  </td>
                  <td><span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{h.duration}</span></td>
                  <td><StatusBadge status={h.status} /></td>
                  <td>
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" style={{ color: "var(--muted-foreground)" }}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "rgba(5,5,5,0.6)" }} />
          <div
            className="relative w-full md:w-[520px] h-full md:h-auto md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl md:mr-6 shadow-2xl animate-scale-in"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              <div>
                <code className="text-xs font-mono" style={{ color: "var(--qs-cyan)" }}>{selected.id}</code>
                <p className="text-base font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{selected.filename}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--muted-foreground)" }}>
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <StatusBadge status={selected.status} />

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Format", value: selected.format },
                  { label: "OCSF Version", value: selected.version },
                  { label: "Uploaded By", value: selected.uploadedBy },
                  { label: "Date", value: selected.uploadedAt },
                  { label: "Duration", value: selected.duration },
                  { label: "Total Events", value: selected.events.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    <p className="text-sm font-semibold font-mono" style={{ color: "var(--foreground)" }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Valid", value: selected.valid.toLocaleString(), color: "var(--qs-green)" },
                  { label: "Rejected", value: selected.rejected, color: selected.rejected > 0 ? "var(--qs-amber)" : "var(--muted-foreground)" },
                  { label: "Rate", value: `${((selected.valid / Math.max(selected.events, 1)) * 100).toFixed(1)}%`, color: "var(--qs-green)" },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {selected.classes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>Event Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.classes.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full border"
                        style={{ borderColor: "var(--qs-green-border)", backgroundColor: "var(--qs-green-dim)", color: "var(--qs-green)" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <a href="/dashboard/ciso/ingestion/events"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-1 justify-center"
                  style={{ backgroundColor: "var(--qs-green)", color: "#000" }}>
                  <Eye className="w-4 h-4" />Explore Events
                </a>
                <a href="/dashboard/ciso/reports"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border hover:bg-muted transition-colors flex-1 justify-center"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <BarChart2 className="w-4 h-4" />Report
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
