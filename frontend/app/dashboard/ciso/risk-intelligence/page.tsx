"use client"

import { useState } from "react"
import { AlertTriangle, TrendingUp, ChevronDown, ChevronRight, Shield, DollarSign } from "lucide-react"

const risks = [
  {
    id: "RSK-001",
    name: "Unpatched CVE-2024-3400 on API Gateway",
    score: 9.1,
    probability: 72,
    impact: "$1.2M",
    assetCriticality: "Critical",
    exploitability: "Active exploit in wild",
    businessImpact: "Payment system disruption, customer data exposure, regulatory fines",
    evidence: ["CVE-2024-3400, CVSS 10.0", "Public PoC available since April 2024", "Asset handles 2,400 payment transactions/day"],
    action: "Apply vendor patch (PAN-OS 10.2.9-h1). Schedule 2-hour maintenance window. Validate with vulnerability scan post-patch.",
    severity: "Critical",
    status: "Open",
    owner: "Infrastructure Team",
    created: "2026-09-24",
  },
  {
    id: "RSK-002",
    name: "Excessive admin privileges on service accounts",
    score: 7.8,
    probability: 38,
    impact: "$840K",
    assetCriticality: "High",
    exploitability: "Low complexity, authenticated access required",
    businessImpact: "Lateral movement enabling access to financial systems and HR data",
    evidence: ["47 service accounts with Domain Admin rights", "Only 4 require elevated privileges", "Last audit 14 months ago"],
    action: "Implement principle of least privilege. Remove unnecessary admin rights from 43 service accounts. Requires AD admin and 4h of work.",
    severity: "High",
    status: "In Progress",
    owner: "Identity Team",
    created: "2026-09-20",
  },
  {
    id: "RSK-003",
    name: "Public S3 bucket with customer PII",
    score: 7.2,
    probability: 45,
    impact: "$720K",
    assetCriticality: "Critical",
    exploitability: "No authentication required — public internet access",
    businessImpact: "GDPR breach notification, potential €20M fine, customer trust damage",
    evidence: ["s3://acme-customer-data has public read ACL", "Contains 84,000 customer records", "Detected in cloud scan 2026-09-25"],
    action: "Immediately set bucket ACL to private. Enable server-side encryption (AES-256). Review CloudTrail logs for unauthorized access.",
    severity: "High",
    status: "Open",
    owner: "Cloud Team",
    created: "2026-09-25",
  },
  {
    id: "RSK-004",
    name: "Weak TLS configuration on legacy portal",
    score: 6.1,
    probability: 28,
    impact: "$380K",
    assetCriticality: "Medium",
    exploitability: "Requires network position (MITM)",
    businessImpact: "Session hijacking, credential theft, compliance failure (PCI DSS)",
    evidence: ["TLS 1.0/1.1 still enabled", "RC4 cipher suite in use", "Self-signed certificate expiring in 14 days"],
    action: "Disable TLS 1.0/1.1. Enable TLS 1.3 only. Replace self-signed cert with CA-signed. Estimated 6h work.",
    severity: "Medium",
    status: "Open",
    owner: "Web Team",
    created: "2026-09-22",
  },
  {
    id: "RSK-005",
    name: "Missing MFA on executive accounts",
    score: 5.8,
    probability: 21,
    impact: "$290K",
    assetCriticality: "Critical",
    exploitability: "Targeted phishing or credential stuffing",
    businessImpact: "Executive account takeover, BEC fraud, unauthorized data access",
    evidence: ["6 of 9 C-suite accounts lack MFA", "2 accounts had login from new geography last month", "CEO account accessed from 3 countries in 24h"],
    action: "Enable Azure AD MFA for all accounts. Use FIDO2 hardware keys for C-suite. Estimated 1 day for rollout.",
    severity: "Medium",
    status: "Open",
    owner: "Identity Team",
    created: "2026-09-19",
  },
]

function SeverityBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    Critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    High: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    Medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    Low: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  }
  return <span className={`info-chip border font-semibold text-[11px] ${m[s]}`}>{s}</span>
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 9 ? "#F43F5E" : value >= 7 ? "#F97316" : value >= 5 ? "#F59E0B" : "#0CA678"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

export default function RiskIntelligencePage() {
  const [expanded, setExpanded] = useState<string | null>("RSK-001")
  const [filter, setFilter] = useState("All")

  const filtered = filter === "All" ? risks : risks.filter((r) => r.severity === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Risk Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{risks.length} open risks · Ranked by severity · Demo data</p>
        </div>

        {/* Risk Matrix Link */}
        <div className="flex items-center gap-2">
          {["All", "Critical", "High", "Medium", "Low"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-[18px] h-[18px] text-primary" />
          Risk Matrix — Probability vs. Impact
        </h2>
        <div className="relative h-52 bg-muted/30 rounded-xl border border-border overflow-hidden">
          {/* Grid Labels */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
            Probability →
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">
            Financial Impact →
          </div>

          {/* Quadrant Colors */}
          <div className="absolute inset-8 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden">
            <div className="bg-amber-500/5" />
            <div className="bg-rose-500/8" />
            <div className="bg-accent/5" />
            <div className="bg-amber-500/5" />
          </div>

          {/* Risk Dots */}
          {risks.map((r) => {
            const x = (parseFloat(r.impact.replace(/[^0-9.]/g, "")) / 1.5) * 70 + 10
            const y = 100 - r.probability + 5
            const color = r.severity === "Critical" ? "#F43F5E" : r.severity === "High" ? "#F97316" : "#F59E0B"
            return (
              <div
                key={r.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${Math.min(x, 85)}%`, top: `${Math.max(y, 15)}%` }}
                title={r.name}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/30 shadow-lg transition-transform hover:scale-125"
                  style={{ backgroundColor: color }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-card border border-border rounded px-2 py-1 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                  {r.id}: {r.score}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {filtered.map((risk) => (
          <div key={risk.id} className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
            {/* Card Header */}
            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === risk.id ? null : risk.id)}
            >
              <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                risk.severity === "Critical" ? "bg-rose-500" :
                risk.severity === "High" ? "bg-orange-500" : "bg-amber-500"
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono text-muted-foreground">{risk.id}</code>
                  <SeverityBadge s={risk.severity} />
                  <span className="text-xs text-muted-foreground">Owner: {risk.owner}</span>
                </div>
                <p className="font-semibold text-sm">{risk.name}</p>
              </div>

              <div className="hidden md:flex items-center gap-8 flex-shrink-0">
                <div className="w-32">
                  <p className="text-[10px] text-muted-foreground mb-1">Risk Score</p>
                  <ScoreBar value={risk.score} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Probability</p>
                  <p className="font-bold text-amber-500">{risk.probability}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Impact</p>
                  <p className="font-bold text-rose-500">{risk.impact}</p>
                </div>
              </div>

              <div className={`transition-transform ${expanded === risk.id ? "rotate-180" : ""}`}>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>

            {/* Expanded Detail */}
            {expanded === risk.id && (
              <div className="px-6 pb-6 pt-0 border-t border-border space-y-5 animate-fade-in">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {[
                    { icon: AlertTriangle, label: "Exploitability", val: risk.exploitability, color: "text-rose-500" },
                    { icon: Shield, label: "Asset Criticality", val: risk.assetCriticality, color: "text-primary" },
                    { icon: TrendingUp, label: "Probability", val: `${risk.probability}%`, color: "text-amber-500" },
                    { icon: DollarSign, label: "Financial Impact", val: risk.impact, color: "text-orange-500" },
                  ].map(({ icon: Icon, label, val, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                      </div>
                      <p className="font-semibold text-sm">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-2">
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Business Impact</p>
                    <p className="text-sm text-foreground leading-relaxed">{risk.businessImpact}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Technical Evidence</p>
                    <ul className="space-y-1.5">
                      {risk.evidence.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Recommended Action</p>
                    <p className="text-sm leading-relaxed">{risk.action}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
