"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts"
import {
  Shield, TrendingDown, AlertTriangle, Activity, Server,
  ArrowUpRight, ArrowDownRight, ChevronRight, Zap, HelpCircle,
  X, CheckCircle2, Radio, ExternalLink, FileText, Download, Fingerprint,
  Cloud, Crosshair, DollarSign, Database, Clock, RefreshCw, BarChart2
} from "lucide-react"
import Link from "next/link"
import { ModelConfidence } from "@/components/dashboard/model-confidence"
import { RemediationBacklog } from "@/components/dashboard/remediation-backlog"
import { RiskTimeline } from "@/components/dashboard/risk-timeline"
import { ReportGeneratorModal } from "@/components/dashboard/report-generator"

// ─── Helpers ────────────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Critical: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    High: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${map[severity] || ""}`}>{severity}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    "In Progress": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Investigating: "bg-primary/10 text-primary border-primary/20",
    Contained: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  }
  return <span className={`info-chip border font-medium text-[11px] ${map[status] || ""}`}>{status}</span>
}

function getBarColor(score: number) {
  if (score >= 88) return "#0CA678"
  if (score >= 70) return "#F59E0B"
  return "#F43F5E"
}

function MetricCard({ 
  title, value, subtext, icon: Icon, colorClass, highlightValue = false 
}: { 
  title: string, value: string | number | null, subtext?: string, icon?: any, colorClass?: string, highlightValue?: boolean 
}) {
  const hasData = value !== null && value !== undefined && value !== "";
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass?.replace('text-', 'bg-').replace('500', '500/10')}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
        )}
      </div>
      <div>
        {hasData ? (
          <>
            <p className={`text-2xl font-black tracking-tight font-mono ${highlightValue ? colorClass : ''}`}>{value}</p>
            {subtext && <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{subtext}</p>}
          </>
        ) : (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded">No data available</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-xs mb-1 font-mono">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function SectionHeader({ title, icon: Icon, timeString }: { title: string, icon: any, timeString?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 mt-12 first:mt-6 border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      {timeString && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/50">
          <RefreshCw className="w-3 h-3" /> Data freshness: {timeString}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CISODashboard() {
  const [backendData, setBackendData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  // Fetch backend data
  useEffect(() => {
    fetch("/api/run-pipeline", { method: "POST" })
      .then(r => r.json())
      .then(d => { 
        setBackendData(d); 
        setLoading(false);
        setLastFetchTime(new Date());
      })
      .catch(() => {
        setLoading(false)
        setLastFetchTime(new Date());
      })
  }, [])

  const freshnessStr = lastFetchTime ? "just now" : "loading...";
  const d = backendData;

  // -- Safe Extractors --
  const ciso = d?.ciso_metrics || {};
  const cfo = d?.cfo_metrics || {};
  const ingest = d?.ingestion_metrics || {};
  
  // Security Posture
  const securityScore = ciso.overall_security_posture_score ? Math.round(ciso.overall_security_posture_score) : null;
  const activeVulns = ciso.total_active_vulnerabilities;
  const criticalRisks = ciso.cvss_severity_distribution?.counts?.Critical;
  
  // Asset Intelligence
  const assetsLoaded = ingest.assets_loaded;
  const externalFacing = ciso.attack_surface_exposure_index?.external_facing_vulnerable_endpoints;
  const internalFacing = ciso.attack_surface_exposure_index?.internal_only_vulnerable_endpoints;
  
  // Vulnerability Exposure
  const exploitedRatio = ciso.exploitability_threat_index?.exploited_ratio_percent;
  const exploitedCount = ciso.exploitability_threat_index?.actively_exploited_cves;
  const avgOpenDays = ciso.unpatched_vulnerability_aging?.average_open_days;
  
  // Financial Risk
  const aleLakhs = cfo.mean_annual_loss_expectancy_lakhs;
  const maxLoss = cfo.p95_value_at_risk_lakhs;
  const budget = cfo.budget_utilization?.allocated_budget_lakhs;
  const remediationCost = cfo.budget_utilization?.proposed_remediation_cost_lakhs;
  const riskReduction = cfo.total_financial_risk_reduction_lakhs;

  const dynamicRisks = ciso.top_technical_risk_drivers || [];
  
  const riskPieData = ciso.cvss_severity_distribution?.counts 
    ? [
        { name: "Critical", value: ciso.cvss_severity_distribution.counts.Critical, color: "#F43F5E" },
        { name: "High", value: ciso.cvss_severity_distribution.counts.High, color: "#F97316" },
        { name: "Medium", value: ciso.cvss_severity_distribution.counts.Medium, color: "#F59E0B" },
        { name: "Low", value: ciso.cvss_severity_distribution.counts.Low, color: "#0CA678" },
      ].filter(x => x.value > 0)
    : [];

  const trendData = cfo.quarter_over_quarter_risk_trend || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <ReportGeneratorModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} data={d} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sticky top-16 z-30 bg-background/95 backdrop-blur py-4 border-b border-border shadow-sm -mx-6 px-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Overview Dashboard</p>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              · Data source: QuantifySec Risk Engine
            </span>
            {d && (
              <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold">
                REAL DATA
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Central Intelligence</h1>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <span className="live-dot" /> Live System Monitoring
          </div>
          <button 
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      {!d && !loading && (
        <div className="p-8 text-center bg-muted/30 border border-border rounded-xl">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold text-lg">No connection to Risk Engine</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">Could not load the central data model. Please ensure the backend API is running to fetch actual QuantifySec data.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-24">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {d && (
        <>
          {/* SECTION: SECURITY POSTURE */}
          <SectionHeader title="Security Posture" icon={Shield} timeString={freshnessStr} />
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="col-span-2 lg:col-span-1 xl:col-span-1 bg-card border border-border rounded-xl p-5 flex items-center justify-center">
              <ModelConfidence />
            </div>
            
            <div className="col-span-2 lg:col-span-1 xl:col-span-1 bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke={getBarColor(securityScore || 0)} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - (securityScore || 0) / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono">{securityScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Overall Security Score</p>
              </div>
            </div>

            <MetricCard title="Total Vulnerabilities" value={activeVulns} subtext="Active findings in system" icon={Crosshair} colorClass="text-primary" />
            <MetricCard title="Critical Risks" value={criticalRisks} subtext="Require immediate action" icon={AlertTriangle} colorClass="text-rose-500" highlightValue />
            <MetricCard title="Model Confidence" value="High" subtext="Based on Monte Carlo iterations" icon={BarChart2} colorClass="text-emerald-500" />
          </div>

          {/* SECTION: FINANCIAL RISK */}
          <SectionHeader title="Financial Risk & Exposure" icon={DollarSign} timeString={freshnessStr} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard title="Expected Loss (ALE)" value={aleLakhs ? `₹${aleLakhs}L` : null} subtext="Annualized Loss Expectancy" icon={TrendingDown} colorClass="text-rose-500" highlightValue />
            <MetricCard title="Max Potential Loss" value={maxLoss ? `₹${maxLoss}L` : null} subtext="p95 Value at Risk" icon={AlertTriangle} colorClass="text-orange-500" />
            <MetricCard title="Remediation Budget" value={budget ? `₹${budget}L` : null} subtext="Allocated for security" icon={DollarSign} colorClass="text-emerald-500" />
            <MetricCard title="Estimated Fix Cost" value={remediationCost ? `₹${remediationCost}L` : null} subtext="Cost to address top risks" icon={DollarSign} colorClass="text-primary" />
            <MetricCard title="Risk Reduction" value={riskReduction ? `₹${riskReduction}L` : null} subtext="Potential exposure reduction" icon={ArrowDownRight} colorClass="text-emerald-500" highlightValue />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Risk Trend (Expected Loss)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `₹${val}L`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="mean_ale_lakhs" name="Expected Loss (Lakhs)" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-1">Financial Loss Distribution</h2>
              <p className="text-xs text-muted-foreground mb-4">Top 5 assets by expected financial loss</p>
              <div className="space-y-4">
                {cfo.asset_level_financial_loss_treemap?.slice(0, 5).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{a.asset_id}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.business_unit} · Score: {a.criticality_score}</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-rose-500">₹{a.financial_exposure_lakhs}L</span>
                  </div>
                ))}
                {(!cfo.asset_level_financial_loss_treemap || cfo.asset_level_financial_loss_treemap.length === 0) && (
                  <p className="text-sm text-muted-foreground">No financial exposure data available.</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: ASSET INTELLIGENCE & CLOUD */}
          <SectionHeader title="Asset Intelligence & Cloud" icon={Server} timeString={freshnessStr} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard title="Total Assets" value={assetsLoaded} subtext="Ingested from sources" icon={Database} colorClass="text-primary" />
            <MetricCard title="Internet-Facing" value={externalFacing} subtext="Assets exposed to WAN" icon={Cloud} colorClass="text-orange-500" />
            <MetricCard title="Internal Assets" value={internalFacing} subtext="Behind firewall" icon={Server} colorClass="text-emerald-500" />
            <MetricCard title="Cloud Assets" value={null} subtext="AWS/Azure/GCP specific" icon={Cloud} colorClass="text-muted-foreground" />
          </div>

          {/* SECTION: VULNERABILITY EXPOSURE */}
          <SectionHeader title="Vulnerability Exposure" icon={AlertTriangle} timeString={freshnessStr} />
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-1">Risk Severity Distribution</h2>
              <p className="text-xs text-muted-foreground mb-4">Breakdown of all active open risks</p>
              {riskPieData.length > 0 ? (
                <>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                          {riskPieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(val, name) => [`${val} risks`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {riskPieData.map((r: any) => (
                      <div key={r.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="text-xs text-muted-foreground">{r.name}</span>
                        <span className="text-xs font-bold font-mono ml-auto">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground italic">No vulnerability data</div>
              )}
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <MetricCard title="Exploited Vulnerabilities" value={exploitedCount} subtext={`${exploitedRatio}% of total open`} icon={Crosshair} colorClass="text-rose-500" highlightValue />
              <MetricCard title="Avg Vulnerability Age" value={avgOpenDays ? `${avgOpenDays} Days` : null} subtext="Time since discovery" icon={Clock} colorClass="text-amber-500" />
              <div className="col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Top Critical Findings</h3>
                <div className="space-y-3">
                  {dynamicRisks.slice(0, 3).map((r: any) => (
                    <div key={r.cve_id + r.asset_id} className="flex items-start justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">{r.cve_id}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.asset_id}</p>
                      </div>
                      <div className="text-right">
                        <SeverityBadge severity={r.severity} />
                        <p className="text-[10px] text-rose-500 font-bold mt-1">₹{r.expected_annual_loss_lakhs}L Loss</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold">Full Risk Register</h2>
                <p className="text-xs text-muted-foreground">Prioritized by expected financial loss</p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] dashboard-scroll">
              <table className="w-full data-table">
                <thead className="sticky top-0 bg-card z-10 shadow-sm">
                  <tr>
                    <th className="w-8">Severity</th>
                    <th>Vulnerability</th>
                    <th>Asset</th>
                    <th>CVSS</th>
                    <th>Expected Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicRisks.map((risk: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="text-center">
                        <SeverityBadge severity={risk.severity} />
                      </td>
                      <td>
                        <span className="font-medium text-xs text-primary">{risk.cve_id}</span>
                        {risk.known_exploited && <span className="ml-2 text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20">KEV</span>}
                      </td>
                      <td className="text-[11px] font-mono">{risk.asset_id}</td>
                      <td>
                        <span className={`font-bold font-mono text-xs ${risk.cvss_score >= 9 ? "text-rose-500" : risk.cvss_score >= 7 ? "text-orange-500" : "text-amber-500"}`}>
                          {risk.cvss_score}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold font-mono text-sm text-rose-500">₹{risk.expected_annual_loss_lakhs}L</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION: IDENTITY & THREAT ACTIVITY */}
          <SectionHeader title="Identity & Threat Activity" icon={Fingerprint} timeString={freshnessStr} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard title="Identities" value={null} subtext="From IAM integration" icon={Fingerprint} />
            <MetricCard title="Privileged Access Risk" value={null} subtext="High-risk accounts" icon={Shield} />
            <MetricCard title="Threat Detections" value={null} subtext="Suspicious activity" icon={Zap} />
            <MetricCard title="MITRE Techniques" value={null} subtext="Observed attack patterns" icon={Crosshair} />
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm py-12">
            No IAM or active threat feed data mapped from the current OCSF ingestion source.
          </div>

          {/* SECTION: REMEDIATION & TIMELINE */}
          <SectionHeader title="Remediation Strategy" icon={CheckCircle2} timeString={freshnessStr} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RemediationBacklog data={cfo.remediation_cost_efficiency_table} />
            </div>
            <div className="lg:col-span-1 h-[600px]">
              <RiskTimeline />
            </div>
          </div>

        </>
      )}
    </div>
  )
}
