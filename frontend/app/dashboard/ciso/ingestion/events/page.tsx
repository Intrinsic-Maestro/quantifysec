"use client"

import { useState } from "react"
import {
  ChevronRight, Search, Filter, Eye, Shield, Server,
  User, Clock, Globe, Activity, AlertTriangle, X, Code2,
  ChevronDown, Network
} from "lucide-react"

const SAMPLE_EVENTS = [
  {
    id: "EVT-001-A3F2",
    time: "2026-09-27 16:48:02",
    classUid: 3002,
    class: "Authentication",
    category: "Identity & Access",
    activity: "Logon",
    severity: "High",
    severityId: 4,
    source: "Identity Provider",
    device: "auth-server-01",
    user: "rsharma@acme.com",
    srcIp: "45.33.32.156",
    dstIp: "10.0.1.20",
    status: "Failure",
    message: "Failed authentication attempt from geolocation anomaly",
    raw: '{\n  "class_uid": 3002,\n  "category_uid": 3,\n  "time": 1727451082000,\n  "severity_id": 4,\n  "activity_id": 2,\n  "status_id": 2,\n  "actor": {\n    "user": { "name": "rsharma", "email": "rsharma@acme.com", "uid": "USR-0042" },\n    "session": { "uid": "sess-a3f2" }\n  },\n  "src_endpoint": { "ip": "45.33.32.156", "location": { "country": "RU" } },\n  "dst_endpoint": { "ip": "10.0.1.20", "hostname": "auth-server-01" },\n  "metadata": { "version": "1.1.0", "product": { "name": "Okta", "vendor_name": "Okta Inc." } }\n}',
  },
  {
    id: "EVT-002-B8C1",
    time: "2026-09-27 16:34:15",
    classUid: 2001,
    class: "Network Activity",
    category: "Network",
    activity: "Traffic",
    severity: "Critical",
    severityId: 5,
    source: "Firewall",
    device: "fw-edge-01",
    user: "N/A",
    srcIp: "185.220.101.42",
    dstIp: "192.168.10.5",
    status: "Blocked",
    message: "Inbound connection to internal SMTP relay from known malicious IP",
    raw: '{\n  "class_uid": 2001,\n  "category_uid": 2,\n  "time": 1727450055000,\n  "severity_id": 5,\n  "activity_id": 1,\n  "connection_info": { "direction_id": 1, "protocol_num": 6 },\n  "src_endpoint": { "ip": "185.220.101.42", "port": 49823 },\n  "dst_endpoint": { "ip": "192.168.10.5", "port": 25, "hostname": "mail-relay-01" },\n  "traffic": { "bytes_in": 1204, "bytes_out": 0, "packets_in": 3 },\n  "metadata": { "version": "1.1.0", "product": { "name": "Palo Alto NGFW" } }\n}',
  },
  {
    id: "EVT-003-D5E9",
    time: "2026-09-27 15:12:44",
    classUid: 4001,
    class: "File Activity",
    category: "File System",
    activity: "Read",
    severity: "Medium",
    severityId: 3,
    source: "Endpoint EDR",
    device: "ACME-LAPTOP-0192",
    user: "mwilliams@acme.com",
    srcIp: "10.0.2.88",
    dstIp: "N/A",
    status: "Success",
    message: "Sensitive PII file accessed outside business hours",
    raw: '{\n  "class_uid": 4001,\n  "category_uid": 4,\n  "time": 1727445764000,\n  "severity_id": 3,\n  "activity_id": 1,\n  "actor": {\n    "user": { "name": "mwilliams", "email": "mwilliams@acme.com" },\n    "process": { "name": "notepad.exe", "pid": 4821 }\n  },\n  "file": { "name": "customer_pii_export.xlsx", "path": "C:\\\\Users\\\\mwilliams\\\\Downloads\\\\customer_pii_export.xlsx", "size": 2048392 },\n  "device": { "hostname": "ACME-LAPTOP-0192", "ip": "10.0.2.88" },\n  "metadata": { "version": "1.1.0", "product": { "name": "CrowdStrike Falcon" } }\n}',
  },
  {
    id: "EVT-004-F2A7",
    time: "2026-09-27 14:55:01",
    classUid: 3003,
    class: "Authentication",
    category: "Identity & Access",
    activity: "Logon",
    severity: "Informational",
    severityId: 1,
    source: "Identity Provider",
    device: "sso-gateway-01",
    user: "admin@acme.com",
    srcIp: "10.1.0.5",
    dstIp: "10.0.1.20",
    status: "Success",
    message: "Successful SSO authentication for admin account",
    raw: '{\n  "class_uid": 3002,\n  "category_uid": 3,\n  "time": 1727444101000,\n  "severity_id": 1,\n  "activity_id": 2,\n  "status_id": 1,\n  "actor": { "user": { "name": "admin", "email": "admin@acme.com" } },\n  "src_endpoint": { "ip": "10.1.0.5" },\n  "dst_endpoint": { "ip": "10.0.1.20", "hostname": "sso-gateway-01" },\n  "metadata": { "version": "1.1.0" }\n}',
  },
  {
    id: "EVT-005-C9B3",
    time: "2026-09-27 12:22:18",
    classUid: 6001,
    class: "Vulnerability Finding",
    category: "Findings",
    activity: "Detected",
    severity: "Critical",
    severityId: 5,
    source: "Cloud (AWS)",
    device: "prod-api-gateway",
    user: "N/A",
    srcIp: "N/A",
    dstIp: "54.200.10.88",
    status: "Open",
    message: "CVE-2024-3400 detected on production API gateway — CVSS 10.0",
    raw: '{\n  "class_uid": 6001,\n  "category_uid": 6,\n  "time": 1727437338000,\n  "severity_id": 5,\n  "activity_id": 1,\n  "finding": {\n    "uid": "CVE-2024-3400",\n    "title": "Palo Alto Networks PAN-OS OS Command Injection Vulnerability",\n    "types": ["CVE"],\n    "created_time": 1727437338000\n  },\n  "vulnerabilities": [{ "cve": { "uid": "CVE-2024-3400", "cvss": [{ "base_score": 10.0, "version": "3.1" }] } }],\n  "resource": { "name": "prod-api-gateway", "type": "EC2 Instance", "uid": "i-0a1b2c3d4e5f" },\n  "metadata": { "version": "1.1.0", "product": { "name": "AWS Security Hub" } }\n}',
  },
]

const SEV_COLORS: Record<string, string> = {
  Critical: "var(--qs-red)",
  High: "#FF6B35",
  Medium: "var(--qs-amber)",
  Low: "var(--qs-green)",
  Informational: "var(--qs-cyan)",
}

const SEV_BG: Record<string, string> = {
  Critical: "rgba(255,59,48,0.08)",
  High: "rgba(255,107,53,0.08)",
  Medium: "rgba(255,176,32,0.08)",
  Low: "rgba(0,200,120,0.08)",
  Informational: "rgba(0,184,169,0.08)",
}

function SevBadge({ sev }: { sev: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded"
      style={{ color: SEV_COLORS[sev] ?? "var(--foreground)", backgroundColor: SEV_BG[sev] ?? "var(--muted)" }}>
      {sev}
    </span>
  )
}

export default function EventExplorerPage() {
  const [search, setSearch] = useState("")
  const [sevFilter, setSevFilter] = useState("All")
  const [classFilter, setClassFilter] = useState("All")
  const [selectedEvent, setSelectedEvent] = useState<typeof SAMPLE_EVENTS[0] | null>(null)
  const [tab, setTab] = useState<"overview" | "context" | "raw">("overview")

  const filtered = SAMPLE_EVENTS.filter(ev => {
    const q = search.toLowerCase()
    const matchSearch = !q || ev.message.toLowerCase().includes(q) || ev.user.toLowerCase().includes(q)
      || ev.srcIp.includes(q) || ev.device.toLowerCase().includes(q) || ev.id.toLowerCase().includes(q)
    const matchSev = sevFilter === "All" || ev.severity === sevFilter
    const matchClass = classFilter === "All" || ev.class === classFilter
    return matchSearch && matchSev && matchClass
  })

  const classes = ["All", ...Array.from(new Set(SAMPLE_EVENTS.map(e => e.class)))]
  const sevs = ["All", "Critical", "High", "Medium", "Low", "Informational"]

  return (
    <div className="space-y-5 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>Security Operations</span><ChevronRight className="w-3 h-3" />
        <span>Data Ingestion</span><ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>OCSF Event Explorer</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>OCSF Event Explorer</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Browse and inspect ingested OCSF events · 18,412 events indexed · OCSF-20260927-001
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: "18,412", color: "var(--foreground)" },
          { label: "Critical", value: "42", color: "var(--qs-red)" },
          { label: "High", value: "284", color: "#FF6B35" },
          { label: "Medium", value: "1,203", color: "var(--qs-amber)" },
          { label: "Informational", value: "12,079", color: "var(--qs-cyan)" },
        ].map(s => (
          <div key={s.label} className="metric-card py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl border"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events, IPs, users, devices..."
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /></button>}
        </div>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm border outline-none"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          {sevs.map(s => <option key={s} value={s}>{s === "All" ? "All Severities" : s}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm border outline-none"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          {classes.map(c => <option key={c} value={c}>{c === "All" ? "All Classes" : c}</option>)}
        </select>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Events</p>
          <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{filtered.length} shown (demo: 5 of 18,412)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Event Class</th>
                <th>Activity</th>
                <th>Source</th>
                <th>User</th>
                <th>Src IP</th>
                <th>Message</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id} className="cursor-pointer" onClick={() => { setSelectedEvent(ev); setTab("overview") }}>
                  <td><span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{ev.time}</span></td>
                  <td><SevBadge sev={ev.severity} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 flex-shrink-0" style={{ color: "var(--qs-cyan)" }} />
                      <span className="text-xs" style={{ color: "var(--foreground)" }}>{ev.class}</span>
                    </div>
                  </td>
                  <td><span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ev.activity}</span></td>
                  <td><span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ev.source}</span></td>
                  <td><span className="text-xs font-mono" style={{ color: "var(--foreground)" }}>{ev.user}</span></td>
                  <td><span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{ev.srcIp}</span></td>
                  <td className="max-w-[280px]">
                    <p className="text-xs truncate" style={{ color: "var(--foreground)" }}>{ev.message}</p>
                  </td>
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

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: "rgba(5,5,5,0.6)" }} />
          <div
            className="relative w-full md:w-[600px] h-[90vh] md:h-full overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--card)", borderLeft: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              <div>
                <div className="flex items-center gap-2">
                  <SevBadge sev={selectedEvent.severity} />
                  <code className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{selectedEvent.id}</code>
                </div>
                <p className="text-base font-bold mt-1" style={{ color: "var(--foreground)" }}>{selectedEvent.class} — {selectedEvent.activity}</p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                style={{ color: "var(--muted-foreground)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6" style={{ borderColor: "var(--border)" }}>
              {(["overview", "context", "raw"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors capitalize"
                  style={{ borderBottomColor: tab === t ? "var(--qs-green)" : "transparent", color: tab === t ? "var(--qs-green)" : "var(--muted-foreground)" }}>
                  {t === "raw" ? "Raw OCSF" : t === "context" ? "Security Context" : "Overview"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {tab === "overview" && (
                <>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{selectedEvent.message}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Event ID", value: selectedEvent.id, mono: true },
                      { label: "Timestamp", value: selectedEvent.time, mono: true },
                      { label: "OCSF Class UID", value: `${selectedEvent.classUid}`, mono: true },
                      { label: "Category", value: selectedEvent.category },
                      { label: "Activity", value: selectedEvent.activity },
                      { label: "Status", value: selectedEvent.status },
                      { label: "Source System", value: selectedEvent.source },
                      { label: "Device", value: selectedEvent.device, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="p-3 rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                        <p className={`text-xs font-semibold ${mono ? "font-mono" : ""}`} style={{ color: "var(--foreground)" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Network Info */}
                  {selectedEvent.srcIp !== "N/A" && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>Network</p>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                        <div className="text-xs font-mono" style={{ color: "var(--foreground)" }}>
                          <span style={{ color: "var(--qs-red)" }}>{selectedEvent.srcIp}</span>
                          <span style={{ color: "var(--muted-foreground)" }}> → </span>
                          <span style={{ color: "var(--qs-green)" }}>{selectedEvent.dstIp}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* User Info */}
                  {selectedEvent.user !== "N/A" && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>Identity</p>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                        <User className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        <span className="text-xs font-mono" style={{ color: "var(--foreground)" }}>{selectedEvent.user}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === "context" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" style={{ borderColor: "rgba(255,176,32,0.25)", backgroundColor: "rgba(255,176,32,0.04)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--qs-amber)" }}>Risk Context</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      This event has been classified as a security signal. It is part of an active risk analysis chain.
                      Severity: <strong style={{ color: SEV_COLORS[selectedEvent.severity] }}>{selectedEvent.severity}</strong>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--foreground)" }}>Related Events (Demo)</p>
                    <div className="space-y-2">
                      {["09:31 Failed login from 45.33.32.156", "09:33 Failed login from 45.33.32.156", "09:34 Successful login", "09:36 Privilege escalation attempt"].map(e => (
                        <div key={e} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded"
                          style={{ backgroundColor: "var(--card)" }}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--qs-amber)" }} />
                          <span style={{ color: "var(--foreground)" }}>{e}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>
                      Demo correlation data. Production connects to backend correlation engine.
                    </p>
                  </div>
                </div>
              )}

              {tab === "raw" && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Original OCSF JSON</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedEvent.raw)}
                      className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded border hover:bg-muted transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      <Code2 className="w-3 h-3" />Copy JSON
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
