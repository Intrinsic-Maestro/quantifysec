"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, X, ArrowRight, Clock, Server, AlertTriangle,
  ShieldAlert, FileBarChart, Users, Activity, Hash
} from "lucide-react"
import { getPrimaryCISO, getPrimaryCFO } from "@/lib/users"

// ─── Search Index (frontend mock layer — replace with API later) ──────────────
const SEARCH_INDEX = [
  // Assets
  { id: "asset-1", type: "Asset", category: "Assets", title: "prod-api-gateway", description: "Production API Gateway · 12 open vulns", href: "/dashboard/ciso", icon: Server, tags: ["api", "gateway", "production"] },
  { id: "asset-2", type: "Asset", category: "Assets", title: "s3://acme-customer-data", description: "Public S3 Bucket · Customer PII · High Risk", href: "/dashboard/ciso", icon: Server, tags: ["s3", "storage", "cloud", "pii"] },
  { id: "asset-3", type: "Asset", category: "Assets", title: "AD Domain Controller", description: "Active Directory · 3 privilege escalation paths", href: "/dashboard/ciso", icon: Server, tags: ["active directory", "identity", "domain"] },
  { id: "asset-4", type: "Asset", category: "Assets", title: "legacy-portal.acme.com", description: "Web Portal · Weak TLS · Medium Risk", href: "/dashboard/ciso", icon: Server, tags: ["web", "portal", "tls", "legacy"] },
  // Vulnerabilities
  { id: "vuln-1", type: "Vulnerability", category: "Vulnerabilities", title: "CVE-2024-3400", description: "Critical · PAN-OS GlobalProtect RCE · CVSS 10.0", href: "/dashboard/ciso", icon: ShieldAlert, tags: ["cve", "rce", "api", "panos", "critical"] },
  { id: "vuln-2", type: "Vulnerability", category: "Vulnerabilities", title: "API Gateway Exposure", description: "Public endpoint with no auth · Critical", href: "/dashboard/ciso", icon: ShieldAlert, tags: ["api", "gateway", "exposure", "vulnerability", "auth"] },
  { id: "vuln-3", type: "Vulnerability", category: "Vulnerabilities", title: "Weak TLS 1.0 Configuration", description: "Deprecated protocol on legacy portal · Medium", href: "/dashboard/ciso", icon: ShieldAlert, tags: ["tls", "ssl", "legacy", "encryption"] },
  { id: "vuln-4", type: "Vulnerability", category: "Vulnerabilities", title: "Missing MFA on Executive Accounts", description: "Azure AD Executive Group · 8 accounts affected", href: "/dashboard/ciso", icon: ShieldAlert, tags: ["mfa", "identity", "authentication", "executive"] },
  // Risks
  { id: "risk-1", type: "Risk", category: "Risks", title: "Public API Attack Surface", description: "$1.2M exposure · Critical · RSK-001", href: "/dashboard/ciso", icon: AlertTriangle, tags: ["api", "attack surface", "risk", "exposure"] },
  { id: "risk-2", type: "Risk", category: "Risks", title: "Excessive Admin Privileges", description: "$840K exposure · High · RSK-002", href: "/dashboard/ciso", icon: AlertTriangle, tags: ["admin", "privilege", "identity", "risk"] },
  { id: "risk-3", type: "Risk", category: "Risks", title: "Public S3 Data Exposure", description: "$720K exposure · High · Customer PII at risk", href: "/dashboard/ciso", icon: AlertTriangle, tags: ["s3", "data", "pii", "exposure", "cloud"] },
  // Incidents
  { id: "inc-1", type: "Incident", category: "Incidents", title: "INC-0291 — Suspicious Login", description: "Unknown IP · High Severity · Investigating", href: "/dashboard/ciso", icon: Activity, tags: ["incident", "login", "suspicious", "investigation"] },
  { id: "inc-2", type: "Incident", category: "Incidents", title: "INC-0290 — VPN Brute Force", description: "Brute force on VPN endpoint · Resolved", href: "/dashboard/ciso", icon: Activity, tags: ["incident", "vpn", "brute force", "resolved"] },
  { id: "inc-3", type: "Incident", category: "Incidents", title: "INC-1042 API Attack", description: "Automated API abuse · High Severity · Resolved", href: "/dashboard/ciso", icon: Activity, tags: ["incident", "api", "attack", "automation"] },
  // Reports
  { id: "rep-1", type: "Report", category: "Reports", title: "Q4 Executive Risk Report", description: "Executive summary · PDF · Generated 3h ago", href: "/dashboard/ciso", icon: FileBarChart, tags: ["report", "executive", "risk", "q4"] },
  { id: "rep-2", type: "Report", category: "Reports", title: "Vulnerability Assessment Report", description: "Full scan results · 47 findings", href: "/dashboard/ciso", icon: FileBarChart, tags: ["report", "vulnerability", "assessment"] },
  { id: "rep-3", type: "Report", category: "Reports", title: "CFO Risk & Financial Report", description: "Financial exposure analysis · $4.2M total", href: "/dashboard/cfo", icon: FileBarChart, tags: ["report", "cfo", "financial", "risk"] },
  // Users
  { id: "usr-1", type: "User", category: "Users", title: `${getPrimaryCISO().name} — CISO`, description: `${getPrimaryCISO().email} · Last login 2h ago`, href: "/dashboard/ciso", icon: Users, tags: ["user", "ciso", "admin"] },
  { id: "usr-2", type: "User", category: "Users", title: `${getPrimaryCFO().name} — CFO`, description: `${getPrimaryCFO().email} · Last login 4h ago`, href: "/dashboard/cfo", icon: Users, tags: ["user", "cfo"] },
]

const RECENT_SEARCHES = ["CVE-2024-3400", "API vulnerability", "INC-0291", "Risk exposure"]

function fuzzyMatch(query: string, item: typeof SEARCH_INDEX[0]): boolean {
  const q = query.toLowerCase()
  return (
    item.title.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.tags.some(t => t.includes(q)) ||
    item.type.toLowerCase().includes(q)
  )
}

const CATEGORY_ORDER = ["Vulnerabilities", "Risks", "Incidents", "Assets", "Reports", "Users"]

const CATEGORY_COLORS: Record<string, string> = {
  Vulnerabilities: "text-rose-500 bg-rose-500/10",
  Risks: "text-orange-500 bg-orange-500/10",
  Incidents: "text-amber-500 bg-amber-500/10",
  Assets: "text-teal-400 bg-teal-400/10",
  Reports: "text-emerald-400 bg-emerald-400/10",
  Users: "text-slate-300 bg-slate-300/10",
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim().length > 0
    ? SEARCH_INDEX.filter(item => fuzzyMatch(query, item))
    : []

  // Group by category in preferred order
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof SEARCH_INDEX>>((acc, cat) => {
    const items = results.filter(r => r.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const flatResults = Object.values(grouped).flat()

  const openSearch = useCallback(() => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery("")
    setSelected(0)
  }, [])

  const navigate = useCallback((href: string) => {
    closeSearch()
    router.push(href)
  }, [closeSearch, router])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        open ? closeSearch() : openSearch()
      }
      if (e.key === "Escape") closeSearch()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, openSearch, closeSearch])

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open || flatResults.length === 0) return
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, flatResults.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === "Enter" && flatResults[selected]) { navigate(flatResults[selected].href) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, flatResults, selected, navigate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]" onClick={closeSearch}>
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(5,5,5,0.7)' }} />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Search assets, risks, vulnerabilities, incidents..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--foreground)' }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 rounded-md hover:bg-muted transition-colors" style={{ color: 'var(--muted-foreground)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-mono" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto dashboard-scroll">
          {query.trim() === "" ? (
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <Clock className="w-3.5 h-3.5" /> Recent Searches
              </p>
              <div className="space-y-1">
                {RECENT_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-muted"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-5 mb-2" style={{ color: 'var(--muted-foreground)' }}>Search across</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map(cat => (
                  <span key={cat} className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[cat]}`}>{cat}</span>
                ))}
              </div>
            </div>
          ) : flatResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldAlert className="w-10 h-10 mb-3" style={{ color: 'var(--muted-foreground)', opacity: 0.3 }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>No results found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Try searching for an asset, CVE, incident ID, or risk</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>{category}</p>
                  {items.map((item) => {
                    const globalIdx = flatResults.indexOf(item)
                    const isSelected = globalIdx === selected
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelected(globalIdx)}
                        onClick={() => navigate(item.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                        style={isSelected
                          ? { backgroundColor: 'var(--qs-green-dim)', border: '1px solid var(--qs-green-border)' }
                          : { border: '1px solid transparent' }
                        }
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CATEGORY_COLORS[category]}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.title}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{item.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 transition-opacity" style={{ opacity: isSelected ? 1 : 0, color: 'var(--qs-green)' }} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>↑↓</kbd> navigate
          </span>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>↵</kbd> open
          </span>
          <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>ESC</kbd> close
          </span>
          <span className="text-[10px] ml-auto font-mono" style={{ color: 'var(--muted-foreground)' }}>{flatResults.length} result{flatResults.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  )
}
