"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"
import {
  DollarSign, TrendingDown, TrendingUp, Shield, PieChart,
  ArrowUpRight, ArrowDownRight, Info, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { ModelConfidence } from "@/components/dashboard/model-confidence"

// ─── Demo Data ───────────────────────────────────────────────────────────────
const quarterlyRiskTrend = [
  { quarter: "Q1 '24", exposure: 5.8, investment: 0.72, residual: 5.1 },
  { quarter: "Q2 '24", exposure: 5.2, investment: 0.80, residual: 4.5 },
  { quarter: "Q3 '24", exposure: 4.6, investment: 0.84, residual: 3.8 },
  { quarter: "Q4 '24", exposure: 4.2, investment: 0.84, residual: 3.4 },
]

const budgetAllocation = [
  { category: "Endpoint Security", amount: 210, pct: 25 },
  { category: "Cloud Security", amount: 168, pct: 20 },
  { category: "Identity & Access", amount: 126, pct: 15 },
  { category: "Threat Intelligence", amount: 126, pct: 15 },
  { category: "Compliance & Audit", amount: 84, pct: 10 },
  { category: "Incident Response", amount: 84, pct: 10 },
  { category: "Training & Awareness", amount: 42, pct: 5 },
]

const financialRisks = [
  { risk: "Data Breach — Customer PII", impact: "$4.2M", probability: "18%", cost: "$120K", residual: "$3.4M", priority: "Critical" },
  { risk: "Ransomware Attack", impact: "$3.1M", probability: "12%", cost: "$200K", residual: "$2.7M", priority: "Critical" },
  { risk: "API Credential Theft", impact: "$1.8M", probability: "24%", cost: "$45K", residual: "$1.4M", priority: "High" },
  { risk: "Supply Chain Compromise", impact: "$2.4M", probability: "8%", cost: "$160K", residual: "$2.2M", priority: "High" },
  { risk: "Insider Threat", impact: "$890K", probability: "15%", cost: "$80K", residual: "$760K", priority: "Medium" },
  { risk: "Cloud Misconfiguration", impact: "$640K", probability: "31%", cost: "$30K", residual: "$610K", priority: "Medium" },
]

const COLORS = ["#3B5BDB", "#0CA678", "#F59E0B", "#F43F5E", "#8B5CF6", "#EC4899", "#06B6D4"]

type View = "executive" | "technical"

function MetricCard({ label, value, sub, trend, trendDir, icon: Icon, iconBg }: {
  label: string
  value: string
  sub: string
  trend?: string
  trendDir?: "up-good" | "up-bad" | "down-good"
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
}) {
  const trendClass = trendDir?.includes("good") ? "stat-up" : "stat-down"
  const TrendIcon = trendDir?.startsWith("up") ? ArrowUpRight : ArrowDownRight
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      {trend && (
        <p className={`flex items-center gap-0.5 text-xs font-medium mt-1 ${trendClass}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trend}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function PriorityBadge({ p }: { p: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[p]}`}>{p}</span>
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? `$${p.value}M` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function CFODashboard() {
  const [view, setView] = useState<View>("executive")
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    fetch("/api/dashboard/cfo")
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])
  
  const currentExposure = data?.cfo_metrics?.mean_annual_loss_expectancy_lakhs 
    ? `$${(data.cfo_metrics.mean_annual_loss_expectancy_lakhs / 100).toFixed(1)}M` 
    : "$4.2M"
    
  const dynamicRiskTrend = data?.cfo_metrics?.quarter_over_quarter_risk_trend?.map((t: any) => ({
    quarter: t.quarter,
    exposure: (t.mean_ale_lakhs / 100).toFixed(2),
    residual: ((t.mean_ale_lakhs * 0.85) / 100).toFixed(2),
    investment: 0.84
  })) || quarterlyRiskTrend
  
  const securityInvestment = data?.company_context?.allocated_security_budget_lakhs
    ? `$${Math.round(data.company_context.allocated_security_budget_lakhs)}K`
    : "$840K"
    
  const riskReduction = data?.cfo_metrics?.total_financial_risk_reduction_lakhs
    ? `${Math.round(data.cfo_metrics.total_financial_risk_reduction_lakhs)}%`
    : "68%"
    
  const securityROI = data?.cfo_metrics?.return_on_security_investment?.rosi_ratio
    ? `${data.cfo_metrics.return_on_security_investment.rosi_ratio.toFixed(1)}×`
    : "4.2×"
    
  const dynamicFinancialRisks = data?.cfo_metrics?.remediation_cost_efficiency_table
    ? data.cfo_metrics.remediation_cost_efficiency_table.map((r: any) => ({
        risk: r.name,
        impact: `$${(r.risk_reduction_lakhs / 100).toFixed(2)}M`,
        probability: "N/A",
        cost: `$${Math.round(r.cost_lakhs)}K`,
        residual: `$${((r.risk_reduction_lakhs * 0.1) / 100).toFixed(2)}M`, // rough estimation for display
        priority: r.risk_reduction_per_lakh > 5 ? "Critical" : r.risk_reduction_per_lakh > 2 ? "High" : "Medium"
      }))
    : financialRisks


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Risk Intelligence</h1>
        </div>

        {/* Executive / Technical Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
          {(["executive", "technical"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                view === v
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "executive" ? "Executive View" : "Technical View"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center">
          <ModelConfidence />
        </div>
        <MetricCard
          label="Total Risk Exposure"
          value={currentExposure}
          sub="Probability-weighted annual loss"
          trend="-$1.6M from Q1 2024"
          trendDir="down-good"
          icon={DollarSign}
          iconBg="bg-rose-500/10 text-rose-500"
        />
        <MetricCard
          label="Security Investment"
          value={securityInvestment}
          sub="Annual security budget"
          trend="+$80K from last year"
          trendDir="up-good"
          icon={Shield}
          iconBg="bg-primary/10 text-primary"
        />
        <MetricCard
          label="Risk Reduction"
          value={riskReduction}
          sub="Exposure reduced by controls"
          trend="+8% this quarter"
          trendDir="up-good"
          icon={TrendingDown}
          iconBg="bg-accent/10 text-accent"
        />
        <MetricCard
          label="Security ROI"
          value={securityROI}
          sub="Risk avoided per $ invested"
          trend="+0.6× from last year"
          trendDir="up-good"
          icon={TrendingUp}
          iconBg="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quarterly Risk Trend */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Risk Exposure vs. Investment Trend</h2>
            <p className="text-xs text-muted-foreground">In $M — quarterly view</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dynamicRiskTrend} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="M" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="exposure" stroke="#F43F5E" strokeWidth={2.5} dot={{ fill: "#F43F5E", r: 4 }} name="Risk Exposure" />
              <Line type="monotone" dataKey="residual" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#F59E0B", r: 4 }} name="Residual Risk" strokeDasharray="5 3" />
              <Line type="monotone" dataKey="investment" stroke="#0CA678" strokeWidth={2.5} dot={{ fill: "#0CA678", r: 4 }} name="Security Investment" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            {[
              { label: "Risk Exposure", color: "#F43F5E" },
              { label: "Residual Risk", color: "#F59E0B" },
              { label: "Investment", color: "#0CA678" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Budget Allocation */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold">Security Budget Allocation</h2>
            <p className="text-xs text-muted-foreground">$840K annual · by category</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={budgetAllocation} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="K" />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: "var(--foreground)" }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => [`$${v}K`, "Budget"]} />
              <Bar dataKey="amount" radius={4} label={{ position: "right", fontSize: 10, fontWeight: 600, formatter: (v: number) => `$${v}K` }}>
                {budgetAllocation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Executive Summary (shown in executive mode) */}
      {view === "executive" && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Expected Annual Loss", value: currentExposure, sub: "If no additional controls added", color: "border-rose-500/30 bg-rose-500/5" },
            { label: "Budget Required to Reduce 20%", value: data?.cfo_metrics?.budget_utilization?.proposed_remediation_cost_lakhs ? `$${Math.round(data.cfo_metrics.budget_utilization.proposed_remediation_cost_lakhs)}K` : "$210K", sub: "Estimated additional investment needed", color: "border-amber-500/30 bg-amber-500/5" },
            { label: "Cyber Insurance Recommended", value: data?.cfo_metrics?.p95_value_at_risk_lakhs ? `$${(data.cfo_metrics.p95_value_at_risk_lakhs / 100).toFixed(1)}M` : "$2M", sub: "Coverage floor based on residual risk", color: "border-primary/30 bg-primary/5" },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{card.label}</p>
              <p className="text-3xl font-black">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Financial Risk Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold">Financial Risk Register</h2>
            <p className="text-xs text-muted-foreground">Probability-weighted impact analysis</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            Values are estimates based on industry data
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Risk Scenario</th>
                <th>Potential Impact</th>
                <th>Probability</th>
                <th>Mitigation Cost</th>
                <th>Residual Risk</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {dynamicFinancialRisks.map((r: any, i: number) => (
                <tr key={i}>
                  <td>
                    <p className="font-medium text-sm">{r.risk}</p>
                  </td>
                  <td className="font-bold text-rose-500">{r.impact}</td>
                  <td className="text-muted-foreground">{r.probability}</td>
                  <td className="text-primary font-medium">{r.cost}</td>
                  <td className="text-amber-500 font-semibold">{r.residual}</td>
                  <td><PriorityBadge p={r.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical View additions */}
      {view === "technical" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Linked Technical Risks → Financial Impact</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The following CVEs and misconfigurations are driving the financial risk estimates above.
          </p>
          <div className="space-y-3">
            {[
              { cve: "CVE-2024-3400", cvss: "10.0", asset: "prod-api-gateway", risk: "Data Breach", contribution: "$1.2M" },
              { cve: "CVE-2023-44487", cvss: "7.5", asset: "nginx-lb-prod", risk: "Service Disruption", contribution: "$840K" },
              { cve: "CVE-2024-21413", cvss: "9.8", asset: "exchange-server-01", risk: "Credential Theft", contribution: "$680K" },
            ].map((c) => (
              <div key={c.cve} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-rose-500 font-semibold">{c.cve}</code>
                <span className="text-xs font-bold text-amber-500 w-10">CVSS {c.cvss}</span>
                <span className="text-xs text-muted-foreground flex-1">{c.asset}</span>
                <span className="text-xs text-muted-foreground">→ {c.risk}</span>
                <span className="text-xs font-bold text-rose-500 ml-auto">{c.contribution}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/ciso/risk-intelligence" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-4">
            View full technical risk details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
