"use client"

import { useState } from "react"
import { ChevronRight, CheckCircle2, AlertTriangle, XCircle, Eye, Info, BarChart2 } from "lucide-react"
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts"

const QUALITY_METRICS = [
  { label: "Schema Validity", value: 98.7, color: "var(--qs-green)", desc: "Events conforming to OCSF schema" },
  { label: "Required Fields", value: 99.4, color: "var(--qs-green)", desc: "Events with all required OCSF fields" },
  { label: "Timestamp Quality", value: 99.8, color: "var(--qs-green)", desc: "Events with valid ISO-8601 timestamps" },
  { label: "Unknown Fields", value: 98.9, color: "var(--qs-amber)", desc: "Events free of unrecognized field names" },
  { label: "Malformed Events", value: 99.98, color: "var(--qs-green)", desc: "Events that were fully parseable" },
]

const INVALID_EVENTS = [
  {
    id: "EVT-4821",
    class: "Authentication (3001)",
    severity: "High",
    time: "2026-09-26 09:31",
    issue: "Invalid ISO-8601 timestamp",
    field: "time",
    reason: "The 'time' field must be an integer epoch millisecond or ISO-8601 string. Received: '2026/09/26 09:31' (slash-separated date not accepted by OCSF v1.1.0 schema).",
    raw: '{\n  "class_uid": 3001,\n  "category_uid": 3,\n  "time": "2026/09/26 09:31",\n  "severity_id": 3,\n  "activity_id": 1,\n  "actor": { "user": { "name": "jsmith" } }\n}',
  },
  {
    id: "EVT-9204",
    class: "Network Activity (2001)",
    severity: "Medium",
    time: "2026-09-26 14:17",
    issue: "severity_id out of valid range",
    field: "severity_id",
    reason: "OCSF defines severity_id values 0-6 (Unknown, Informational, Low, Medium, High, Critical, Fatal). Received value 9 is outside the allowed enumeration.",
    raw: '{\n  "class_uid": 2001,\n  "category_uid": 2,\n  "time": 1727355420000,\n  "severity_id": 9,\n  "activity_id": 2,\n  "src_endpoint": { "ip": "10.0.1.45" },\n  "dst_endpoint": { "ip": "203.0.113.9" }\n}',
  },
  {
    id: "EVT-15006",
    class: "File Activity (4001)",
    severity: "Low",
    time: "2026-09-27 08:02",
    issue: "IPv6 address in IPv4 endpoint field",
    field: "dst_endpoint.ip",
    reason: "The dst_endpoint.ip field expects a dotted-decimal IPv4 address string. Received an IPv6 loopback address '::1'. Use dst_endpoint.ip_addr or the appropriate typed field for IPv6.",
    raw: '{\n  "class_uid": 4001,\n  "category_uid": 4,\n  "time": 1727413320000,\n  "severity_id": 2,\n  "activity_id": 1,\n  "dst_endpoint": {\n    "ip": "::1",\n    "port": 443\n  }\n}',
  },
]

function QualityGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const data = [{ value, fill: color }]
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={220} endAngle={-40}>
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "var(--border)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black font-mono" style={{ color }}>{value}%</span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--foreground)" }}>{label}</p>
    </div>
  )
}

export default function DataQualityPage() {
  const [selectedEvent, setSelectedEvent] = useState<typeof INVALID_EVENTS[0] | null>(null)
  const [tab, setTab] = useState<"overview" | "raw">("overview")

  return (
    <div className="space-y-6 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>Security Operations</span>
        <ChevronRight className="w-3 h-3" />
        <span>Data Ingestion</span>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Data Quality</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>Data Quality</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            OCSF validation metrics and rejected event inspector · OCSF-20260927-001
          </p>
        </div>
        <a href="/dashboard/ciso/ingestion/history"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          All Ingestions
        </a>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
        style={{ backgroundColor: "rgba(0,184,169,0.05)", borderColor: "rgba(0,184,169,0.2)" }}>
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--qs-cyan)" }} />
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Invalid events are preserved and never silently discarded. You can inspect each rejected record, understand why it failed, and re-upload corrected data. Valid events were indexed for analysis.
        </p>
      </div>

      {/* Quality Gauges */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "var(--muted-foreground)" }}>Quality Metrics — Last Import</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {QUALITY_METRICS.map(m => <QualityGauge key={m.label} value={m.value} color={m.color} label={m.label} />)}
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUALITY_METRICS.slice(0, 3).map(m => (
            <div key={m.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
              {m.value >= 99 ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : m.value >= 95 ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{m.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invalid Events */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" style={{ color: "var(--qs-red)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Invalid Events</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,59,48,0.1)", color: "var(--qs-red)" }}>17 rejected</span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Click any row to inspect</p>
        </div>

        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Event Class</th>
              <th>Issue</th>
              <th>Field</th>
              <th>Timestamp</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {INVALID_EVENTS.map(ev => (
              <tr key={ev.id} className="cursor-pointer" onClick={() => { setSelectedEvent(ev); setTab("overview") }}>
                <td><code className="text-xs font-mono" style={{ color: "var(--qs-red)" }}>{ev.id}</code></td>
                <td><span className="text-xs" style={{ color: "var(--foreground)" }}>{ev.class}</span></td>
                <td>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--qs-amber)" }}>
                    <AlertTriangle className="w-3 h-3" />{ev.issue}
                  </span>
                </td>
                <td><code className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{ev.field}</code></td>
                <td><span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{ev.time}</span></td>
                <td>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" style={{ color: "var(--muted-foreground)" }}>
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={6}>
                <div className="text-center py-2">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>+ 14 more rejected events · </span>
                  <button className="text-xs underline" style={{ color: "var(--qs-green)" }}>Load all</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Event Inspector Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "rgba(5,5,5,0.6)" }} />
          <div
            className="relative w-full md:w-[560px] h-full md:h-auto md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl md:mr-6 shadow-2xl"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              <div>
                <code className="text-xs font-mono" style={{ color: "var(--qs-red)" }}>{selectedEvent.id}</code>
                <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{selectedEvent.issue}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--muted-foreground)" }}>
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6" style={{ borderColor: "var(--border)" }}>
              {(["overview", "raw"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors"
                  style={{
                    borderBottomColor: tab === t ? "var(--qs-green)" : "transparent",
                    color: tab === t ? "var(--qs-green)" : "var(--muted-foreground)"
                  }}>
                  {t === "overview" ? "Validation Error" : "Raw OCSF"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              {tab === "overview" ? (
                <>
                  <div className="p-4 rounded-xl border" style={{ borderColor: "rgba(255,59,48,0.25)", backgroundColor: "rgba(255,59,48,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: "var(--qs-red)" }} />
                      <p className="text-xs font-bold" style={{ color: "var(--qs-red)" }}>Validation Failure</p>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{selectedEvent.reason}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Event Class", value: selectedEvent.class },
                      { label: "Affected Field", value: selectedEvent.field },
                      { label: "Severity", value: selectedEvent.severity },
                      { label: "Timestamp", value: selectedEvent.time },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                        <p className="text-xs font-semibold font-mono" style={{ color: "var(--foreground)" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: "rgba(0,184,169,0.05)", borderColor: "rgba(0,184,169,0.2)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--qs-cyan)" }}>Suggested Fix</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Correct the <code className="font-mono">{selectedEvent.field}</code> field value and re-upload the file, or submit a corrected batch via the API.
                    </p>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedEvent.raw)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded border hover:bg-muted transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      Copy JSON
                    </button>
                  </div>
                  <pre className="text-xs font-mono leading-relaxed p-4 rounded-xl overflow-x-auto"
                    style={{ backgroundColor: "var(--muted)", color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
                    {selectedEvent.raw}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
