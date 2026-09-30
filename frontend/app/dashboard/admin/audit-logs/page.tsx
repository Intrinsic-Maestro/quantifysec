"use client"

import { useState, useMemo } from "react"
import {
  Search, Filter, Download, ChevronLeft, ChevronRight, X,
  Eye, Shield, Settings, UserCheck, AlertTriangle, Link as LinkIcon, Database
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditEvent {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  resource: string
  ip: string
  status: "Success" | "Failure" | "Warning"
  category: string
  prevValue?: string
  newValue?: string
  metadata?: Record<string, string>
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const auditEvents: AuditEvent[] = [
  { id: "EVT-8291", timestamp: "2026-09-26T21:12:04Z", user: "alex.johnson@acme.com", role: "CISO", action: "Changed risk threshold", resource: "Risk Policy — Critical", ip: "192.168.1.45", status: "Success", category: "Configuration", prevValue: "8.0", newValue: "7.5", metadata: { reason: "Board directive to lower acceptable risk", ticketId: "CRM-5512" } },
  { id: "EVT-8290", timestamp: "2026-09-26T20:58:11Z", user: "sarah.chen@acme.com", role: "Security Analyst", action: "Viewed incident details", resource: "INC-0291", ip: "10.0.0.22", status: "Success", category: "Access" },
  { id: "EVT-8289", timestamp: "2026-09-26T20:41:33Z", user: "michael.torres@acme.com", role: "Administrator", action: "Changed user role", resource: "ryan.patel@acme.com", ip: "10.0.0.5", status: "Success", category: "IAM", prevValue: "Security Analyst", newValue: "Team Lead", metadata: { approvedBy: "alex.johnson@acme.com" } },
  { id: "EVT-8288", timestamp: "2026-09-26T20:15:22Z", user: "external-api", role: "API Service", action: "Integration connected", resource: "Splunk SIEM v8.2", ip: "203.0.113.10", status: "Success", category: "Integration" },
  { id: "EVT-8287", timestamp: "2026-09-26T19:58:07Z", user: "lisa.park@acme.com", role: "CFO", action: "Exported financial report", resource: "Q4 Risk Report — PDF", ip: "192.168.1.78", status: "Success", category: "Export" },
  { id: "EVT-8286", timestamp: "2026-09-26T19:33:44Z", user: "unknown@external.com", role: "Unknown", action: "Failed login attempt", resource: "QuantifySec Platform", ip: "45.33.32.156", status: "Failure", category: "Auth", metadata: { attempts: "7", blocked: "true", country: "Russia" } },
  { id: "EVT-8285", timestamp: "2026-09-26T19:21:18Z", user: "alex.johnson@acme.com", role: "CISO", action: "Updated security configuration", resource: "MFA Policy — All Users", ip: "192.168.1.45", status: "Success", category: "Configuration", prevValue: "Optional", newValue: "Required" },
  { id: "EVT-8284", timestamp: "2026-09-26T18:47:52Z", user: "ryan.patel@acme.com", role: "Security Analyst", action: "Created incident", resource: "INC-0292 — Ransomware Alert", ip: "10.0.0.31", status: "Success", category: "Incident" },
  { id: "EVT-8283", timestamp: "2026-09-26T18:22:09Z", user: "michael.torres@acme.com", role: "Administrator", action: "Deleted user account", resource: "former.employee@acme.com", ip: "10.0.0.5", status: "Warning", category: "IAM", metadata: { reason: "Employee offboarding", deprovisioned: "true" } },
  { id: "EVT-8282", timestamp: "2026-09-26T17:55:30Z", user: "sarah.chen@acme.com", role: "Security Analyst", action: "Closed incident", resource: "INC-0290", ip: "10.0.0.22", status: "Success", category: "Incident", prevValue: "Open", newValue: "Resolved" },
  { id: "EVT-8281", timestamp: "2026-09-26T17:30:12Z", user: "api-scanner", role: "API Service", action: "Vulnerability scan completed", resource: "Production Network Segment", ip: "10.0.0.100", status: "Success", category: "Scan", metadata: { findings: "47", critical: "3", high: "12" } },
  { id: "EVT-8280", timestamp: "2026-09-26T16:44:07Z", user: "lisa.park@acme.com", role: "CFO", action: "Viewed risk intelligence", resource: "Financial Risk Register", ip: "192.168.1.78", status: "Success", category: "Access" },
]

const categories = ["All", "Configuration", "Access", "IAM", "Integration", "Export", "Auth", "Incident", "Scan"]
const roles = ["All", "CISO", "CFO", "Security Analyst", "Administrator", "API Service"]
const statuses = ["All", "Success", "Failure", "Warning"]

function ActionIcon({ category }: { category: string }) {
  const map: Record<string, React.ReactNode> = {
    Configuration: <Settings className="w-3.5 h-3.5" />,
    Access: <Eye className="w-3.5 h-3.5" />,
    IAM: <UserCheck className="w-3.5 h-3.5" />,
    Integration: <LinkIcon className="w-3.5 h-3.5" />,
    Export: <Download className="w-3.5 h-3.5" />,
    Auth: <AlertTriangle className="w-3.5 h-3.5" />,
    Incident: <Shield className="w-3.5 h-3.5" />,
    Scan: <Database className="w-3.5 h-3.5" />,
  }
  return <>{map[category] || <Eye className="w-3.5 h-3.5" />}</>
}

function StatusPill({ status }: { status: string }) {
  const m: Record<string, string> = {
    Success: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    Failure: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    Warning: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[status]}`}>{status}</span>
}

function CategoryPill({ cat }: { cat: string }) {
  return (
    <span className="info-chip border border-border bg-muted text-muted-foreground font-medium text-[11px]">
      {cat}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  }
}

const PAGE_SIZE = 8

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [role, setRole] = useState("All")
  const [status, setStatus] = useState("All")
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const filtered = useMemo(() => {
    return auditEvents.filter((e) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        e.user.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      const matchCat = category === "All" || e.category === category
      const matchRole = role === "All" || e.role === role
      const matchStatus = status === "All" || e.status === status
      return matchSearch && matchCat && matchRole && matchStatus
    })
  }, [search, category, role, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetFilters = () => {
    setSearch(""); setCategory("All"); setRole("All"); setStatus("All"); setPage(1)
  }

  const hasFilters = search || category !== "All" || role !== "All" || status !== "All"

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete activity trail · {auditEvents.length} events · <span className="text-amber-500 font-medium">Demo data</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs font-medium">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by user, action, resource, or event ID..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Selects */}
          {[
            { label: "Category", val: category, setVal: setCategory, opts: categories },
            { label: "Role", val: role, setVal: setRole, opts: roles },
            { label: "Status", val: status, setVal: setStatus, opts: statuses },
          ].map(({ label, val, setVal, opts }) => (
            <select
              key={label}
              value={val}
              onChange={(e) => { setVal(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition cursor-pointer"
              aria-label={label}
            >
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {auditEvents.length} events
        </p>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Status</th>
                <th className="text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    No events match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((event) => {
                  const { date, time } = formatDate(event.timestamp)
                  return (
                    <tr
                      key={event.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <td className="whitespace-nowrap">
                        <p className="text-xs font-medium">{date}</p>
                        <p className="text-xs text-muted-foreground font-mono">{time}</p>
                      </td>
                      <td className="max-w-[160px]">
                        <p className="text-xs font-medium truncate">{event.user}</p>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">{event.role}</span>
                      </td>
                      <td className="max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground flex-shrink-0">
                            <ActionIcon category={event.category} />
                          </span>
                          <p className="text-xs font-medium truncate">{event.action}</p>
                        </div>
                      </td>
                      <td className="max-w-[160px]">
                        <p className="text-xs text-muted-foreground truncate">{event.resource}</p>
                      </td>
                      <td>
                        <code className="text-xs font-mono text-muted-foreground">{event.ip}</code>
                      </td>
                      <td><StatusPill status={event.status} /></td>
                      <td className="text-right">
                        <button
                          className="text-xs text-primary font-medium hover:underline"
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event) }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {filtered.length} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span key={`dots-${p}`} className="text-muted-foreground text-xs px-1">…</span>
                  )}
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      page === p
                        ? "bg-primary text-white"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                </>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-background border-l border-border shadow-2xl overflow-y-auto animate-slide-up dashboard-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card sticky top-0 z-10">
              <div>
                <p className="font-bold">Event Details</p>
                <code className="text-xs text-muted-foreground font-mono">{selectedEvent.id}</code>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="px-6 py-5 space-y-6">
              {/* Status + Category */}
              <div className="flex items-center gap-3">
                <StatusPill status={selectedEvent.status} />
                <CategoryPill cat={selectedEvent.category} />
              </div>

              {/* Core Fields */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "Event ID", val: selectedEvent.id },
                  { key: "Timestamp", val: formatDate(selectedEvent.timestamp).date + " " + formatDate(selectedEvent.timestamp).time },
                  { key: "User", val: selectedEvent.user },
                  { key: "Role", val: selectedEvent.role },
                  { key: "IP Address", val: selectedEvent.ip },
                  { key: "Category", val: selectedEvent.category },
                ].map(({ key, val }) => (
                  <div key={key}>
                    <p className="audit-key">{key}</p>
                    <p className="audit-value break-all mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border" />

              {/* Action + Resource */}
              <div className="space-y-3">
                <div>
                  <p className="audit-key">Action</p>
                  <p className="audit-value mt-0.5">{selectedEvent.action}</p>
                </div>
                <div>
                  <p className="audit-key">Resource</p>
                  <p className="audit-value mt-0.5">{selectedEvent.resource}</p>
                </div>
              </div>

              {/* Change Values */}
              {(selectedEvent.prevValue || selectedEvent.newValue) && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-sm font-semibold mb-3">Change Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                        <p className="audit-key text-rose-500">Previous Value</p>
                        <p className="audit-value mt-1">{selectedEvent.prevValue || "—"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/5 border border-accent/15">
                        <p className="audit-key text-accent">New Value</p>
                        <p className="audit-value mt-1">{selectedEvent.newValue || "—"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Metadata */}
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-sm font-semibold mb-3">Metadata</p>
                    <div className="space-y-2 rounded-lg bg-muted/50 border border-border p-4">
                      {Object.entries(selectedEvent.metadata).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-3">
                          <p className="audit-key w-28 flex-shrink-0">{k}</p>
                          <p className="audit-value text-xs break-all">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
