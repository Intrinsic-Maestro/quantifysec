"use client"

import { useState } from "react"
import { Globe2, Server, Cloud, Wifi, AlertTriangle, ChevronRight, ExternalLink, Shield } from "lucide-react"

const categories = [
  { id: "all", label: "All Assets", count: 248 },
  { id: "domain", label: "Domains", count: 12 },
  { id: "subdomain", label: "Subdomains", count: 47 },
  { id: "ip", label: "Public IPs", count: 23 },
  { id: "api", label: "APIs", count: 34 },
  { id: "cloud", label: "Cloud Resources", count: 89 },
  { id: "port", label: "Exposed Ports", count: 43 },
]

const assets = [
  { id: "AS-001", type: "domain", name: "acme.com", risk: "Low", vulns: 0, exposure: "Public", ports: [80, 443], status: "Secure" },
  { id: "AS-002", type: "subdomain", name: "api.acme.com", risk: "Critical", vulns: 3, exposure: "Public", ports: [80, 443, 8080], status: "Vulnerable" },
  { id: "AS-003", type: "subdomain", name: "admin.acme.com", risk: "High", vulns: 1, exposure: "Public", ports: [443, 8443], status: "At Risk" },
  { id: "AS-004", type: "ip", name: "203.0.113.45", risk: "Medium", vulns: 2, exposure: "Public", ports: [22, 80, 443], status: "Warning" },
  { id: "AS-005", type: "cloud", name: "s3://acme-customer-data", risk: "Critical", vulns: 1, exposure: "Public", ports: [], status: "Exposed" },
  { id: "AS-006", type: "api", name: "/api/v1/payments", risk: "High", vulns: 1, exposure: "Public", ports: [443], status: "At Risk" },
  { id: "AS-007", type: "subdomain", name: "legacy.acme.com", risk: "High", vulns: 4, exposure: "Public", ports: [80, 443, 8080, 3306], status: "Vulnerable" },
  { id: "AS-008", type: "cloud", name: "ec2-prod-app-01", risk: "Medium", vulns: 2, exposure: "Public", ports: [80, 443, 22], status: "Warning" },
  { id: "AS-009", type: "port", name: "203.0.113.45:22 (SSH)", risk: "High", vulns: 0, exposure: "Public", ports: [22], status: "Exposed" },
  { id: "AS-010", type: "subdomain", name: "dev.acme.com", risk: "Medium", vulns: 1, exposure: "Public", ports: [3000, 8080], status: "Warning" },
]

function RiskBadge({ risk }: { risk: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Low: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[risk]}`}>{risk}</span>
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    domain: <Globe2 className="w-4 h-4" />,
    subdomain: <Globe2 className="w-4 h-4" />,
    ip: <Wifi className="w-4 h-4" />,
    api: <Server className="w-4 h-4" />,
    cloud: <Cloud className="w-4 h-4" />,
    port: <AlertTriangle className="w-4 h-4" />,
  }
  return <>{icons[type] || <Globe2 className="w-4 h-4" />}</>
}

export default function AttackSurfacePage() {
  const [selectedCat, setSelectedCat] = useState("all")
  const [selectedAsset, setSelectedAsset] = useState<typeof assets[0] | null>(null)

  const filtered = selectedCat === "all" ? assets : assets.filter((a) => a.type === selectedCat)

  const stats = [
    { label: "Total Assets", value: "248", color: "text-primary" },
    { label: "Critical Exposure", value: "2", color: "text-rose-500" },
    { label: "High Risk", value: "8", color: "text-orange-500" },
    { label: "Exposed Ports", value: "43", color: "text-amber-500" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Attack Surface</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Internet-facing assets and exposure analysis · Demo data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Exposure Visual */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Exposure Overview</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Critical & High Exposure", items: ["api.acme.com — CVE-2024-3400", "s3://acme-customer-data — Public Read", "legacy.acme.com — 4 vulnerabilities", "admin.acme.com — Weak TLS"], color: "border-rose-500/20 bg-rose-500/5" },
            { label: "Medium Exposure", items: ["203.0.113.45 — SSH Port Exposed", "dev.acme.com — Dev environment public", "ec2-prod-app-01 — Unpatched kernel", "210.0.113.12 — Port 8080 open"], color: "border-amber-500/20 bg-amber-500/5" },
            { label: "Secure / Monitored", items: ["acme.com — Clean, CDN protected", "mail.acme.com — SPF/DKIM OK", "docs.acme.com — Read-only content", "status.acme.com — Monitored"], color: "border-accent/20 bg-accent/5" },
          ].map((col) => (
            <div key={col.label} className={`rounded-xl border p-4 space-y-2 ${col.color}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</p>
              {col.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Filter by Type</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCat === cat.id
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs font-bold ${selectedCat === cat.id ? "text-white/80" : "text-muted-foreground"}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Assets Table */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-semibold">Internet-Facing Assets ({filtered.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Vulns</th>
                  <th>Ports</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          <TypeIcon type={asset.type} />
                        </span>
                        <span className="font-mono text-xs font-medium">{asset.name}</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground capitalize">{asset.type}</span>
                    </td>
                    <td><RiskBadge risk={asset.risk} /></td>
                    <td>
                      <span className={`text-sm font-bold ${asset.vulns > 0 ? "text-rose-500" : "text-accent"}`}>
                        {asset.vulns}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {asset.ports.slice(0, 3).map((p) => (
                          <code key={p} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{p}</code>
                        ))}
                        {asset.ports.length > 3 && (
                          <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">+{asset.ports.length - 3}</code>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                        Details <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedAsset(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto animate-slide-up dashboard-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-6 py-5 z-10 flex items-center justify-between">
              <div>
                <p className="font-bold font-mono">{selectedAsset.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedAsset.type}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-2 rounded-lg hover:bg-muted transition">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-2">
                <RiskBadge risk={selectedAsset.risk} />
                <span className="info-chip border border-border text-muted-foreground text-[11px]">{selectedAsset.exposure}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: "Asset ID", v: selectedAsset.id },
                  { k: "Type", v: selectedAsset.type },
                  { k: "Risk Level", v: selectedAsset.risk },
                  { k: "Vulnerabilities", v: String(selectedAsset.vulns) },
                ].map(({ k, v }) => (
                  <div key={k}>
                    <p className="audit-key">{k}</p>
                    <p className="audit-value mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {selectedAsset.ports.length > 0 && (
                <div>
                  <p className="audit-key mb-2">Exposed Ports</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.ports.map((p) => (
                      <code key={p} className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                        p === 22 || p === 3306 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-muted border-border"
                      }`}>{p}</code>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Recommended Action
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedAsset.risk === "Critical"
                    ? "Immediately restrict public access, patch all identified vulnerabilities, and review access logs for any unauthorized activity."
                    : selectedAsset.risk === "High"
                    ? "Schedule remediation within 7 days. Review access controls and apply available security patches."
                    : "Monitor regularly. Review and apply patches in the next maintenance window."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
