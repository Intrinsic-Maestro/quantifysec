"use client"

import { Server, Monitor, Cloud, Smartphone, Cpu, Globe2 } from "lucide-react"

const assets = [
  { type: "Endpoint", count: 842, critical: 2, icon: Monitor, color: "text-primary", bg: "bg-primary/10" },
  { type: "Cloud Instances", count: 89, critical: 1, icon: Cloud, color: "text-accent", bg: "bg-accent/10" },
  { type: "Servers", count: 134, critical: 0, icon: Server, color: "text-amber-500", bg: "bg-amber-500/10" },
  { type: "Network Devices", count: 47, critical: 0, icon: Globe2, color: "text-orange-500", bg: "bg-orange-500/10" },
  { type: "Mobile Devices", count: 128, critical: 0, icon: Smartphone, color: "text-rose-500", bg: "bg-rose-500/10" },
  { type: "IoT / OT", count: 44, critical: 1, icon: Cpu, color: "text-purple-500", bg: "bg-purple-500/10" },
]

const assetList = [
  { name: "prod-api-gateway", type: "Server", os: "Ubuntu 22.04", risk: "Critical", vulns: 3, status: "Online" },
  { name: "exchange-server-01", type: "Server", os: "Windows Server 2019", risk: "High", vulns: 2, status: "Online" },
  { name: "ec2-prod-app-01", type: "Cloud", os: "Amazon Linux 2", risk: "Medium", vulns: 2, status: "Online" },
  { name: "dc-01.acme.local", type: "Server", os: "Windows Server 2022", risk: "Medium", vulns: 1, status: "Online" },
  { name: "acme-laptop-0241", type: "Endpoint", os: "macOS 14.2", risk: "Low", vulns: 0, status: "Online" },
  { name: "legacy-portal-vm", type: "Server", os: "CentOS 7", risk: "High", vulns: 4, status: "Online" },
]

function RiskBadge({ r }: { r: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Low: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[r]}`}>{r}</span>
}

export default function AssetsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">1,284 assets monitored · Demo data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {assets.map((a) => {
          const Icon = a.icon
          return (
            <div key={a.type} className="metric-card text-center">
              <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <p className="text-2xl font-black">{a.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.type}</p>
              {a.critical > 0 && (
                <p className="text-xs text-rose-500 font-semibold mt-1">{a.critical} critical risk</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Asset Inventory (Top by Risk)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>OS</th>
                <th>Risk</th>
                <th>Vulnerabilities</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((a) => (
                <tr key={a.name} className="cursor-pointer">
                  <td><code className="text-xs font-mono text-foreground">{a.name}</code></td>
                  <td className="text-xs text-muted-foreground">{a.type}</td>
                  <td className="text-xs text-muted-foreground">{a.os}</td>
                  <td><RiskBadge r={a.risk} /></td>
                  <td>
                    <span className={`font-bold text-sm ${a.vulns > 0 ? "text-rose-500" : "text-accent"}`}>{a.vulns}</span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
