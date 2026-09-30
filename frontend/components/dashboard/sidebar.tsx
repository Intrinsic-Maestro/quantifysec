"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Shield,
  LayoutDashboard,
  ShieldAlert,
  Bug,
  Server,
  Globe2,
  Flame,
  TrendingUp,
  Brain,
  CheckSquare,
  FileBarChart,
  ScrollText,
  Users,
  Puzzle,
  Settings,
  Sun,
  Moon,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  User,
  LogOut,
  ChevronDown,
  Database,
  Upload,
  History,
  BarChart2,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const cisoNavMain: NavItem[] = [
  { label: "Overview", href: "/dashboard/ciso", icon: LayoutDashboard },
  { label: "Security Posture", href: "/dashboard/ciso/security-posture", icon: ShieldAlert },
  { label: "Threats", href: "/dashboard/ciso/threats", icon: Flame, badge: 14 },
  { label: "Vulnerabilities", href: "/dashboard/ciso/vulnerabilities", icon: Bug, badge: 47 },
  { label: "Assets", href: "/dashboard/ciso/assets", icon: Server },
  { label: "Attack Surface", href: "/dashboard/ciso/attack-surface", icon: Globe2 },
  { label: "Incidents", href: "/dashboard/ciso/incidents", icon: Flame, badge: 3 },
  { label: "Risk Intelligence", href: "/dashboard/ciso/risk-intelligence", icon: TrendingUp },
  { label: "AI Analyst", href: "/dashboard/ciso/ai-analyst", icon: Brain },
  { label: "Compliance", href: "/dashboard/ciso/compliance", icon: CheckSquare },
  { label: "Reports", href: "/dashboard/ciso/reports", icon: FileBarChart },
]

const cisoNavIngestion: NavItem[] = [
  { label: "OCSF Import", href: "/dashboard/ciso/ingestion/ocsf", icon: Upload },
  { label: "Ingestion History", href: "/dashboard/ciso/ingestion/history", icon: History },
  { label: "Data Quality", href: "/dashboard/ciso/ingestion/data-quality", icon: BarChart2 },
]

const cisoNavAdmin: NavItem[] = [
  { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: ScrollText },
  { label: "Team", href: "/dashboard/admin/team", icon: Users },
  { label: "Integrations", href: "/dashboard/admin/integrations", icon: Puzzle },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
]

const cfoNavMain: NavItem[] = [
  { label: "Overview", href: "/dashboard/cfo", icon: LayoutDashboard },
]

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (!["/dashboard/ciso", "/dashboard/cfo"].includes(item.href) && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      className={`sidebar-link group relative ${isActive ? "active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              isActive ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-500"
            }`}>
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
          {typeof item.badge === "number" && item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  )
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const isCfo = pathname.startsWith("/dashboard/cfo")

  return (
    <aside
      className={`relative flex flex-col h-full dashboard-scroll transition-all duration-300 ${
        collapsed ? "w-[64px]" : "w-[240px]"
      }`}
      style={{ backgroundColor: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b flex-shrink-0 ${collapsed ? "justify-center" : "justify-between"}`}
        style={{ borderColor: "var(--sidebar-border)" }}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--qs-green)' }}>
              <Shield className="w-3.5 h-3.5" style={{ color: '#000000' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--sidebar-accent-foreground)" }}>
              QUANTIFY<span style={{ color: 'var(--qs-green)' }}>SEC</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--qs-green)' }}>
            <Shield className="w-3.5 h-3.5" style={{ color: '#000000' }} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white/80 ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto dashboard-scroll px-3 py-2 space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
            style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
            {isCfo ? "Financial Risk" : "Security Operations"}
          </p>
        )}
        {(isCfo ? cfoNavMain : cisoNavMain).map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}

        {!isCfo && (
          <>
            <div className="h-px my-3" style={{ backgroundColor: "var(--sidebar-border)" }} />
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
                style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
                Data Ingestion
              </p>
            )}
            {collapsed && (
              <div className="flex items-center justify-center my-1">
                <Database className="w-4 h-4" style={{ color: "var(--sidebar-foreground)", opacity: 0.4 }} />
              </div>
            )}
            {cisoNavIngestion.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}

            <div className="h-px my-3" style={{ backgroundColor: "var(--sidebar-border)" }} />
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2"
                style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
                Administration
              </p>
            )}
            {cisoNavAdmin.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* User profile */}
      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${
          collapsed ? "justify-center" : ""
        }`}>
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{isCfo ? "SR" : "AJ"}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate">{isCfo ? "Sarah Rogers" : "Alex Johnson"}</p>
              <p className="text-xs truncate" style={{ color: "var(--sidebar-foreground)" }}>{isCfo ? "CFO" : "CISO"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export function DashboardTopBar({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background flex-shrink-0">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="font-semibold text-lg">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group relative"
          onClick={() => {}}
          aria-label="Search"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="font-semibold text-sm">Notifications</p>
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {[
                  { title: "Critical CVE Detected", desc: "CVE-2024-3400 on prod-api-gateway", time: "2m ago", type: "critical" },
                  { title: "New Incident Opened", desc: "#INC-0291 — Suspicious login attempt", time: "18m ago", type: "high" },
                  { title: "Compliance Alert", desc: "SOC 2 control CC6.1 requires review", time: "1h ago", type: "medium" },
                  { title: "Report Ready", desc: "Q4 Executive Risk Report generated", time: "3h ago", type: "info" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer border-b border-border/50 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                      n.type === "critical" ? "bg-rose-500" :
                      n.type === "high" ? "bg-amber-500" :
                      n.type === "medium" ? "bg-yellow-500" : "bg-primary"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">AJ</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">Alex Johnson</p>
                <p className="text-xs text-muted-foreground">CISO · alex@acme.com</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: "Profile Settings" },
                  { icon: Settings, label: "Preferences" },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
                  </button>
                ))}
                <div className="h-px bg-border my-1" />
                <Link href="/login">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/5 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
