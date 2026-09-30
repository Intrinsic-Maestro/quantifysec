"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { getPrimaryCISO, getPrimaryCFO } from "@/lib/users"
import {
  Shield, Search, Bell, User, Settings, LogOut,
  ChevronDown, Sun, Moon, AlertTriangle, Brain, FileBarChart,
  LayoutDashboard, Activity, Server, ShieldAlert, ScrollText,
  DollarSign, Menu, X, CheckCircle2, Globe, TrendingUp, Bug
} from "lucide-react"

// ─── Nav Config ───────────────────────────────────────────────────────────────
interface NavItem { label: string; href: string; icon?: any; desc?: string }

const CISO_NAV: { label: string; href: string; items?: NavItem[] }[] = [
  { label: "Overview", href: "/dashboard/ciso" },
  {
    label: "Security",
    href: "#",
    items: [
      { label: "Security Posture", href: "/dashboard/ciso/security-posture", icon: ShieldAlert, desc: "Domain scores & posture trends" },
      { label: "Threats", href: "/dashboard/ciso/threats", icon: AlertTriangle, desc: "Live threat intelligence feed" },
      { label: "Vulnerabilities", href: "/dashboard/ciso/vulnerabilities", icon: Bug, desc: "CVE register and patch priorities" },
      { label: "Incidents", href: "/dashboard/ciso/incidents", icon: Activity, desc: "Active incidents and response" },
    ],
  },
  {
    label: "Risk & Assets",
    href: "#",
    items: [
      { label: "Risk Intelligence", href: "/dashboard/ciso/risk-intelligence", icon: TrendingUp, desc: "Risk register and exposure metrics" },
      { label: "Assets", href: "/dashboard/ciso/assets", icon: Server, desc: "Monitored assets and inventory" },
      { label: "Attack Surface", href: "/dashboard/ciso/attack-surface", icon: Globe, desc: "External exposure and coverage" },
      { label: "Compliance", href: "/dashboard/ciso/compliance", icon: CheckCircle2, desc: "SOC 2, ISO 27001 status" },
    ],
  },
  {
    label: "Operations",
    href: "#",
    items: [
      { label: "AI Analyst", href: "/dashboard/ciso/ai-analyst", icon: Brain, desc: "AI-powered security insights" },
      { label: "Reports", href: "/dashboard/ciso/reports", icon: FileBarChart, desc: "Generate and download reports" },
      { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: ScrollText, desc: "Full administrative activity trail" },
    ],
  },
  {
    label: "Data Ingestion",
    href: "#",
    items: [
      { label: "OCSF Import", href: "/dashboard/ciso/ingestion/ocsf", icon: Activity, desc: "Import OCSF security event files" },
      { label: "Ingestion History", href: "/dashboard/ciso/ingestion/history", icon: ScrollText, desc: "Past imports and ingestion status" },
      { label: "Data Quality", href: "/dashboard/ciso/ingestion/data-quality", icon: AlertTriangle, desc: "Validation metrics and rejected events" },
    ],
  },
  { label: "CFO View", href: "/dashboard/cfo" },
]

const CFO_NAV: { label: string; href: string; items?: NavItem[] }[] = [
  { label: "Overview", href: "/dashboard/cfo" },
  { label: "Reports", href: "/dashboard/cfo/reports" },
  { label: "CISO View", href: "/dashboard/ciso" },
]

// ─── Dropdown Menu ─────────────────────────────────────────────────────────────
function Dropdown({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const isActive = items.some(i => pathname === i.href || pathname.startsWith(i.href + "/"))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive ? "" : "hover:bg-muted"
        }`}
        style={isActive ? { color: 'var(--qs-green)', backgroundColor: 'var(--qs-green-dim)', fontFamily: 'var(--font-display)' } : { color: 'var(--muted-foreground)', fontFamily: 'var(--font-display)' }}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl shadow-2xl z-50 p-1.5 animate-scale-in" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                style={active ? { backgroundColor: 'var(--qs-green-dim)' } : {}}
              >
                {Icon && (
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                    style={active
                      ? { backgroundColor: 'var(--qs-green-dim)', color: 'var(--qs-green)' }
                      : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: active ? 'var(--qs-green)' : 'var(--foreground)' }}>{item.label}</p>
                  {item.desc && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Topnav ───────────────────────────────────────────────────────────────────
export function DashboardTopNav() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const isCfo = pathname.startsWith("/dashboard/cfo")
  const nav = isCfo ? CFO_NAV : CISO_NAV

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close dropdowns when clicking outside
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const NOTIFICATIONS = [
    { title: "Critical CVE Detected", desc: "CVE-2024-3400 on prod-api-gateway", time: "2m ago", level: "critical" },
    { title: "New Incident Opened", desc: "#INC-0292 — Ransomware Alert", time: "18m ago", level: "high" },
    { title: "Scan Completed", desc: "47 findings · 3 critical · 12 high", time: "1h ago", level: "info" },
    { title: "Report Ready", desc: "Q4 Executive Risk Report generated", time: "3h ago", level: "info" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b" style={{ backgroundColor: 'var(--background)', borderBottomColor: 'var(--border)' }}>
      <div className="flex items-center h-16 px-4 md:px-6 max-w-[1600px] mx-auto gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 mr-4 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-shadow" style={{ backgroundColor: 'var(--qs-green)', boxShadow: '0 0 12px rgba(0,200,120,0.3)' }}>
            <Shield className="w-4 h-4" style={{ color: '#000000' }} />
          </div>
          <span className="font-bold text-base tracking-tight hidden sm:block" style={{ color: 'var(--foreground)' }}>
            QUANTIFY<span style={{ color: 'var(--qs-green)' }}>SEC</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 flex-shrink-0" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {nav.map((item) => {
            if (item.items) {
              return <Dropdown key={item.label} label={item.label} items={item.items} pathname={pathname} />
            }
            const isActive = pathname === item.href
            const isCfoLink = item.href === "/dashboard/cfo" && !isCfo
            const isCisoLink = item.href === "/dashboard/ciso" && isCfo
            const linkColor = isActive
              ? 'var(--qs-green)'
              : isCfoLink || isCisoLink
              ? 'var(--qs-green)'
              : 'var(--muted-foreground)'
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
                style={{ color: linkColor, backgroundColor: isActive ? 'var(--qs-green-dim)' : undefined, fontFamily: 'var(--font-display)' }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 ml-auto">

          {/* Global Search Trigger */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
            className="p-2 rounded-md transition-colors hover:bg-muted group relative"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Open search (Ctrl+K)"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="w-px h-5 mx-0.5 hidden md:block" style={{ backgroundColor: 'var(--border)' }} />

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md transition-colors hover:bg-muted"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-md transition-colors hover:bg-muted"
              style={{ color: 'var(--muted-foreground)' }}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--qs-red)' }} />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Security Alerts</p>
                  <button className="text-xs font-medium hover:underline" style={{ color: 'var(--qs-green)' }}>Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto dashboard-scroll">
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/20" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor:
                        n.level === "critical" ? 'var(--qs-red)' :
                        n.level === "high" ? 'var(--risk-high)' : 'var(--qs-cyan)'
                      }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{n.title}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.desc}</p>
                      </div>
                      <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--qs-green-dim)', border: '1px solid var(--qs-green-border)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--qs-green)', fontFamily: 'monospace' }}>{isCfo ? "SR" : "AJ"}</span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none" style={{ color: 'var(--foreground)' }}>{isCfo ? getPrimaryCFO().name : getPrimaryCISO().name}</span>
                <span className="text-[10px] uppercase tracking-widest leading-none mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{isCfo ? getPrimaryCFO().role : getPrimaryCISO().role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-11 w-52 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in p-1" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-3 py-2.5 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{isCfo ? getPrimaryCFO().name : getPrimaryCISO().name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{isCfo ? getPrimaryCFO().email : getPrimaryCISO().email}</p>
                </div>
                {[
                  { icon: User, label: "Profile Settings", href: "#" },
                  { icon: Settings, label: "Preferences", href: "#" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted" style={{ color: 'var(--muted-foreground)' }}>
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
                <div className="h-px my-1 mx-2" style={{ backgroundColor: 'var(--border)' }} />
                <Link href="/login" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-muted" style={{ color: 'var(--qs-red)' }}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="lg:hidden border-t backdrop-blur-xl animate-slide-up" style={{ backgroundColor: 'var(--background)', borderTopColor: 'var(--border)' }}>
          <nav className="max-w-[1600px] mx-auto px-4 py-3 space-y-1">
            {nav.map((item) => {
              if (item.items) {
                return (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
                    {item.items.map((sub) => {
                      const Icon = sub.icon
                      const isSubActive = pathname === sub.href
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                          style={{ color: isSubActive ? 'var(--qs-green)' : 'var(--muted-foreground)', backgroundColor: isSubActive ? 'var(--qs-green-dim)' : undefined }}
                        >
                          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                          {sub.label}
                        </Link>
                      )
                    })}
                  </div>
                )
              }
              const isItemActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
                  style={{ color: isItemActive ? 'var(--qs-green)' : 'var(--muted-foreground)', backgroundColor: isItemActive ? 'var(--qs-green-dim)' : undefined }}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
