"use client"

import { useState } from "react"
import { MOCK_INTEGRATIONS } from "@/lib/mock-data"
import { 
  ArrowRight, CheckCircle2, ChevronRight, Activity, Server, Database, 
  ShieldCheck, RefreshCw, XCircle, Search, Filter, Plus, ArrowUpRight
} from "lucide-react"

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState("")

  const filtered = MOCK_INTEGRATIONS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      case "Warning": return "text-amber-500 bg-amber-500/10 border-amber-500/20"
      default: return "text-muted-foreground bg-muted border-border"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Connected": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      case "Warning": return <Activity className="w-3.5 h-3.5 text-amber-500" />
      default: return <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Server className="w-3.5 h-3.5" />
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">Integrations</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Ingestion Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect external security tools to continuously ingest, normalize, and update the risk model.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm shadow-md hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Integration
          </button>
        </div>
      </div>

      {/* Global Ingestion Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Integrations", value: MOCK_INTEGRATIONS.length.toString() },
          { label: "Connected Sources", value: MOCK_INTEGRATIONS.filter(i => i.status === "Connected").length.toString() },
          { label: "Total Events Ingested", value: "5.1M+" },
          { label: "Avg Data Freshness", value: "< 5 mins" },
          { label: "OCSF Coverage", value: "92%" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight font-mono">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div className="flex items-center justify-between bg-muted/30 border border-border/50 rounded-xl px-8 py-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Database className="w-5 h-5 text-sky-500" />
          <span className="text-[10px]">Sources</span>
        </div>
        <ArrowRight className="w-4 h-4 text-border" />
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-500" />
          <span className="text-[10px]">Ingestion</span>
        </div>
        <ArrowRight className="w-4 h-4 text-border" />
        <div className="flex flex-col items-center gap-2">
          <Activity className="w-5 h-5 text-amber-500" />
          <span className="text-[10px]">Normalization (OCSF)</span>
        </div>
        <ArrowRight className="w-4 h-4 text-border" />
        <div className="flex flex-col items-center gap-2">
          <Search className="w-5 h-5 text-rose-500" />
          <span className="text-[10px]">Analysis</span>
        </div>
        <ArrowRight className="w-4 h-4 text-border" />
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px]">Risk Model</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 relative">
        <div className={`flex-1 transition-all duration-300 ${selected ? "hidden lg:block lg:w-2/3" : "w-full"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search integrations..." 
                className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary font-sans"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(integration => (
              <div 
                key={integration.id}
                onClick={() => setSelected(integration)}
                className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${selected?.id === integration.id ? 'border-primary shadow-[0_0_0_1px_rgba(var(--primary),0.5)]' : 'border-border'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <span className="font-bold font-mono text-muted-foreground">{integration.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(integration.status)}`}>
                    {getStatusIcon(integration.status)}
                    {integration.status}
                  </div>
                </div>
                
                <h3 className="font-semibold text-base mb-1">{integration.name}</h3>
                <p className="text-xs text-muted-foreground font-editorial mb-4">Last ingested {integration.lastIngestion}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-mono font-medium">{integration.events} events</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Freshness</span>
                    <span className="font-medium text-emerald-500">{integration.freshness}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-1.5">
                  {integration.categories.map((cat: string) => (
                    <span key={cat} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-full lg:w-1/3 bg-card border border-border rounded-xl shadow-xl flex flex-col h-[calc(100vh-12rem)] sticky top-24 overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-border flex justify-between items-start bg-muted/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <span className="font-bold text-lg font-mono text-muted-foreground">{selected.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selected.name}</h2>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(selected.status)}`}>
                    {selected.status}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Last Sync</p>
                  <p className="text-sm font-medium font-mono">{selected.lastSync}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">OCSF Coverage</p>
                  <p className="text-sm font-medium text-primary">{selected.ocsfCoverage}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Discovered Data</p>
                <div className="flex justify-between items-center text-sm">
                  <span>Security Events</span>
                  <span className="font-mono font-medium">{selected.events}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Assets</span>
                  <span className="font-mono font-medium">{selected.assetsDiscovered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Vulnerabilities</span>
                  <span className="font-mono font-medium">{selected.vulnsDiscovered.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Activity</p>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-primary bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-0 md:mx-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-card border border-border p-3 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs">Sync Complete</span>
                        <span className="text-[10px] font-mono text-muted-foreground">2m ago</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Processed 1,420 events.</p>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-border bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-0 md:mx-auto">
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-card border border-border p-3 rounded shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs">Sync Complete</span>
                        <span className="text-[10px] font-mono text-muted-foreground">1h ago</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Processed 2,104 events.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border bg-muted/10 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                <RefreshCw className="w-4 h-4" /> Sync Now
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border font-semibold text-sm rounded-lg hover:bg-muted transition-colors">
                Configure <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
