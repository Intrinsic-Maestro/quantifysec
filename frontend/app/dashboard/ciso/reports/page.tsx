"use client"

import { useState } from "react"
import {
  FileBarChart, Download, Calendar, Plus, Loader2, Eye,
  CheckCircle2, X, ChevronRight, Shield, DollarSign,
  AlertTriangle, FileText, Clock, Filter
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "executive",
    name: "Executive Security Report",
    desc: "Board-ready summary of security posture, key risks, and strategic recommendations.",
    icon: Shield,
    color: "text-primary bg-primary/10 border-primary/20",
    sections: ["Executive Summary", "Security Score", "Top Risks", "Financial Exposure", "Recommendations"],
  },
  {
    id: "ciso",
    name: "CISO Technical Report",
    desc: "Full operational view: vulnerabilities, incidents, threat intelligence, and posture metrics.",
    icon: AlertTriangle,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    sections: ["Threat Activity", "Vulnerabilities", "Incidents", "Security Domains", "Remediation Plan"],
  },
  {
    id: "cfo",
    name: "CFO Financial Risk Report",
    desc: "Financial exposure analysis, security ROI, and budget allocation aligned to risk reduction.",
    icon: DollarSign,
    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    sections: ["Risk Exposure Summary", "Investment vs Reduction", "Financial Risk Register", "ROI Analysis"],
  },
  {
    id: "vulnerability",
    name: "Vulnerability Assessment",
    desc: "Comprehensive scan results with CVE details, affected assets, and patch priorities.",
    icon: FileText,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    sections: ["Finding Summary", "Critical CVEs", "Asset Coverage", "Remediation Priorities"],
  },
  {
    id: "incident",
    name: "Incident Report",
    desc: "Detailed timeline and analysis of security incidents with response actions taken.",
    icon: Clock,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    sections: ["Incident Timeline", "Affected Systems", "Response Actions", "Lessons Learned"],
  },
  {
    id: "compliance",
    name: "Compliance Status Report",
    desc: "SOC 2, ISO 27001, and framework compliance status with gap analysis.",
    icon: CheckCircle2,
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    sections: ["Compliance Overview", "Control Assessment", "Gap Analysis", "Remediation Actions"],
  },
]

const LIBRARY = [
  { name: "Q4 2025 Executive Risk Summary", type: "Executive", date: "2026-09-26", size: "2.4 MB" },
  { name: "Monthly Security Scorecard — September", type: "CISO", date: "2026-09-25", size: "1.8 MB" },
  { name: "Vulnerability Assessment Report", type: "Vulnerability", date: "2026-09-20", size: "4.2 MB" },
  { name: "Compliance Status Report — SOC 2", type: "Compliance", date: "2026-09-15", size: "3.1 MB" },
  { name: "CFO Financial Risk Brief — Q4", type: "CFO Financial", date: "2026-09-10", size: "1.2 MB" },
  { name: "Incident Response Summary — August", type: "Incident", date: "2026-09-01", size: "2.0 MB" },
]

// ─── Report HTML generator ────────────────────────────────────────────────────
function generateReportHTML(type: string, sections: string[], dateRange: string): string {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const reportType = REPORT_TYPES.find(r => r.id === type)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QuantifySec — ${reportType?.name ?? "Report"}</title>
  <style>
    :root { --primary: #3b5bdb; --danger: #f43f5e; --warning: #f59e0b; --success: #0ca678; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; font-size: 14px; line-height: 1.6; }
    .page { max-width: 900px; margin: 0 auto; padding: 48px 40px; background: white; min-height: 100vh; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 32px; border-bottom: 2px solid #e2e8f0; margin-bottom: 40px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo-icon svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 2; }
    .logo-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .logo-text span { color: var(--primary); }
    .meta { text-align: right; color: #64748b; font-size: 12px; }
    .meta strong { display: block; font-size: 14px; color: #0f172a; font-weight: 600; }
    h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 8px; }
    .demo-badge { display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 32px; }
    .section { margin-bottom: 40px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
    .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px; }
    .kpi-value { font-size: 28px; font-weight: 900; font-family: "Courier New", monospace; letter-spacing: -1px; }
    .kpi-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .kpi-good .kpi-value { color: var(--success); }
    .kpi-warn .kpi-value { color: var(--warning); }
    .kpi-bad .kpi-value { color: var(--danger); }
    .kpi-primary .kpi-value { color: var(--primary); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 14px; background: #f1f5f9; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .badge-orange { background: #fff7ed; color: #ea580c; }
    .badge-amber { background: #fffbeb; color: #d97706; }
    .badge-green { background: #f0fdf4; color: #16a34a; }
    .badge-blue { background: #eff6ff; color: #2563eb; }
    .score-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .score-bar-label { width: 140px; font-size: 13px; color: #334155; }
    .score-bar-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 3px; }
    .score-bar-val { width: 36px; text-align: right; font-weight: 700; font-family: "Courier New", monospace; font-size: 13px; }
    .insight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .insight-title { font-weight: 700; font-size: 14px; color: #1e40af; margin-bottom: 6px; }
    .insight-body { font-size: 13px; color: #1e40af; opacity: 0.85; }
    .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print { body { background: white; } .page { padding: 24px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <div class="logo-text">Quantify<span>Sec</span></div>
        <div style="font-size:11px;color:#64748b">Cyber Risk Intelligence Platform</div>
      </div>
    </div>
    <div class="meta">
      <strong>${reportType?.name ?? "Security Report"}</strong>
      Generated: ${now}<br/>
      Period: ${dateRange}<br/>
      Classification: CONFIDENTIAL
    </div>
  </div>

  <div class="demo-badge">⚠ DEMO DATA — Not real measurements</div>

  <h1>${reportType?.name ?? "Security Report"}</h1>
  <p class="subtitle">Prepared for executive review · QuantifySec Risk Intelligence Platform</p>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi kpi-good">
      <div class="kpi-label">Security Score</div>
      <div class="kpi-value">87</div>
      <div class="kpi-sub">↑ +3 from last month</div>
    </div>
    <div class="kpi kpi-warn">
      <div class="kpi-label">Risk Exposure</div>
      <div class="kpi-value">$4.2M</div>
      <div class="kpi-sub">↓ -$340K from Q3</div>
    </div>
    <div class="kpi kpi-bad">
      <div class="kpi-label">Critical Risks</div>
      <div class="kpi-value">3</div>
      <div class="kpi-sub">↑ +1 this week</div>
    </div>
    <div class="kpi kpi-primary">
      <div class="kpi-label">Security ROI</div>
      <div class="kpi-value">4.2×</div>
      <div class="kpi-sub">Risk reduced per $1 spent</div>
    </div>
  </div>

  ${sections.includes("Executive Summary") || sections.includes("Risk Exposure Summary") ? `
  <div class="section">
    <h2>Executive Summary</h2>
    <div class="insight">
      <div class="insight-title">AI Analyst Assessment</div>
      <div class="insight-body">
        The organization's security posture improved by 3 points this month, reaching a score of 87/100. 
        Three critical vulnerabilities on internet-facing assets represent a combined financial exposure of $2.1M. 
        Immediate remediation of CVE-2024-3400 (CVSS 10.0) on the production API gateway is strongly recommended.
        Current security investment of $840K annually is generating a 4.2× risk reduction return.
      </div>
    </div>
  </div>` : ""}

  ${sections.includes("Security Score") || sections.includes("Security Domains") ? `
  <div class="section">
    <h2>Security Domain Scores</h2>
    <div class="score-bar"><div class="score-bar-label">Identity Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:94%;background:#0ca678"></div></div><div class="score-bar-val">94</div></div>
    <div class="score-bar"><div class="score-bar-label">Endpoint Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:91%;background:#0ca678"></div></div><div class="score-bar-val">91</div></div>
    <div class="score-bar"><div class="score-bar-label">Network Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:78%;background:#f59e0b"></div></div><div class="score-bar-val">78</div></div>
    <div class="score-bar"><div class="score-bar-label">Data Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:72%;background:#f59e0b"></div></div><div class="score-bar-val">72</div></div>
    <div class="score-bar"><div class="score-bar-label">Cloud Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:65%;background:#f43f5e"></div></div><div class="score-bar-val">65</div></div>
    <div class="score-bar"><div class="score-bar-label">Application Security</div><div class="score-bar-track"><div class="score-bar-fill" style="width:58%;background:#f43f5e"></div></div><div class="score-bar-val">58</div></div>
  </div>` : ""}

  ${sections.includes("Top Risks") || sections.includes("Financial Risk Register") ? `
  <div class="section">
    <h2>${type === "cfo" ? "Financial Risk Register" : "Top Risks"}</h2>
    <table>
      <thead><tr><th>Risk / Threat</th><th>Potential Impact</th><th>Probability</th><th>Mitigation Cost</th><th>Residual Risk</th><th>Priority</th></tr></thead>
      <tbody>
        <tr><td>Data Breach — Customer PII</td><td><strong>$4.2M</strong></td><td>18%</td><td>$120K</td><td>$3.4M</td><td><span class="badge badge-red">Critical</span></td></tr>
        <tr><td>Ransomware Attack</td><td><strong>$3.1M</strong></td><td>12%</td><td>$200K</td><td>$2.7M</td><td><span class="badge badge-red">Critical</span></td></tr>
        <tr><td>API Credential Theft</td><td><strong>$1.8M</strong></td><td>24%</td><td>$45K</td><td>$1.4M</td><td><span class="badge badge-orange">High</span></td></tr>
        <tr><td>Supply Chain Compromise</td><td><strong>$2.4M</strong></td><td>8%</td><td>$160K</td><td>$2.2M</td><td><span class="badge badge-orange">High</span></td></tr>
        <tr><td>Insider Threat</td><td><strong>$890K</strong></td><td>15%</td><td>$80K</td><td>$760K</td><td><span class="badge badge-amber">Medium</span></td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${sections.includes("Critical CVEs") || sections.includes("Vulnerabilities") ? `
  <div class="section">
    <h2>Critical Vulnerabilities</h2>
    <table>
      <thead><tr><th>CVE / Finding</th><th>Asset</th><th>CVSS</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td><code>CVE-2024-3400</code></td><td>prod-api-gateway</td><td><strong style="color:#f43f5e">10.0</strong></td><td><span class="badge badge-red">Open</span></td><td>Patch immediately</td></tr>
        <tr><td>Public S3 Bucket — PII</td><td>s3://acme-customer-data</td><td><strong style="color:#f43f5e">9.1</strong></td><td><span class="badge badge-red">Open</span></td><td>Restrict ACL</td></tr>
        <tr><td>Weak TLS 1.0</td><td>legacy-portal.acme.com</td><td><strong style="color:#f59e0b">7.2</strong></td><td><span class="badge badge-orange">Open</span></td><td>Upgrade to TLS 1.3</td></tr>
        <tr><td>Missing MFA — Executive</td><td>Azure AD Executive Group</td><td><strong style="color:#f59e0b">6.8</strong></td><td><span class="badge badge-amber">In Progress</span></td><td>Enforce conditional access</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${sections.includes("Recommendations") || sections.includes("Remediation Plan") ? `
  <div class="section">
    <h2>Recommendations</h2>
    <table>
      <thead><tr><th>Priority</th><th>Action</th><th>Expected Risk Reduction</th><th>Effort</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-red">P1</span></td><td>Patch CVE-2024-3400 on prod-api-gateway</td><td>-$1.2M exposure</td><td>4–6 hours</td></tr>
        <tr><td><span class="badge badge-red">P1</span></td><td>Restrict public S3 bucket ACL</td><td>-$720K exposure</td><td>1–2 hours</td></tr>
        <tr><td><span class="badge badge-orange">P2</span></td><td>Enforce MFA on all executive accounts</td><td>-$290K exposure</td><td>Same day</td></tr>
        <tr><td><span class="badge badge-orange">P2</span></td><td>Apply least-privilege on service accounts</td><td>-$840K exposure</td><td>1–2 weeks</td></tr>
        <tr><td><span class="badge badge-amber">P3</span></td><td>Upgrade TLS configuration on legacy portal</td><td>-$380K exposure</td><td>3–5 days</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <span>QuantifySec Risk Intelligence Platform · quantifysec.com</span>
    <span>CONFIDENTIAL — Demo data only · ${now}</span>
  </div>
</div>
</body>
</html>`
}

// ─── Component ────────────────────────────────────────────────────────────────
type Step = "select" | "configure" | "generating" | "preview"

export default function ReportsPage() {
  const [step, setStep] = useState<Step>("select")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState("Q4 2025 (Oct – Dec)")
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [generatedHTML, setGeneratedHTML] = useState<string>("")
  const [progress, setProgress] = useState(0)

  const selectedReport = REPORT_TYPES.find(r => r.id === selectedType)

  function selectType(id: string) {
    setSelectedType(id)
    const report = REPORT_TYPES.find(r => r.id === id)
    setSelectedSections(report?.sections ?? [])
    setStep("configure")
  }

  function toggleSection(s: string) {
    setSelectedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  function generate() {
    setStep("generating")
    setProgress(0)
    const steps = [20, 45, 70, 90, 100]
    steps.forEach((p, i) => {
      setTimeout(() => {
        setProgress(p)
        if (p === 100) {
          const html = generateReportHTML(selectedType!, selectedSections, dateRange)
          setGeneratedHTML(html)
          setTimeout(() => setStep("preview"), 400)
        }
      }, i * 600)
    })
  }

  function downloadReport() {
    const blob = new Blob([generatedHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `QuantifySec-${selectedReport?.name?.replace(/\s+/g, "-") ?? "Report"}-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setStep("select")
    setSelectedType(null)
    setSelectedSections([])
    setGeneratedHTML("")
    setProgress(0)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Reports</p>
          <h1 className="text-2xl font-bold tracking-tight">Report Generator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate, preview, and download security intelligence reports</p>
        </div>
        {step !== "select" && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <X className="w-4 h-4" /> Start Over
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {(["select", "configure", "generating", "preview"] as Step[]).map((s, i) => {
          const labels = ["Select Type", "Configure", "Generating", "Preview & Download"]
          const stepIdx = ["select", "configure", "generating", "preview"].indexOf(step)
          const isActive = s === step
          const isDone = i < stepIdx
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isDone ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : isActive ? "bg-primary text-white"
                : "bg-muted/50 text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="font-mono">{i + 1}</span>}
                {labels[i]}
              </div>
              {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Select Report Type */}
      {step === "select" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Choose the type of report to generate:</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => selectType(rt.id)}
                className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-muted/20 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${rt.color}`}>
                  <rt.icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{rt.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{rt.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Library */}
          <div className="mt-8 bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Report Library</h2>
              <span className="text-xs text-muted-foreground">{LIBRARY.length} reports</span>
            </div>
            <table className="w-full data-table">
              <thead>
                <tr><th>Report</th><th>Type</th><th>Date</th><th>Size</th><th></th></tr>
              </thead>
              <tbody>
                {LIBRARY.map((r) => (
                  <tr key={r.name}>
                    <td className="max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <FileBarChart className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-sm font-medium truncate">{r.name}</p>
                      </div>
                    </td>
                    <td><span className="info-chip border border-border text-muted-foreground text-[11px]">{r.type}</span></td>
                    <td><span className="text-xs text-muted-foreground font-mono">{r.date}</span></td>
                    <td><span className="text-xs text-muted-foreground">{r.size}</span></td>
                    <td>
                      <button className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === "configure" && selectedReport && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Report info */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${selectedReport.color}`}>
                  <selectedReport.icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold">{selectedReport.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedReport.desc}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={e => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  >
                    {["Q4 2025 (Oct – Dec)", "Q3 2025 (Jul – Sep)", "Q2 2025 (Apr – Jun)", "Q1 2025 (Jan – Mar)", "Last 30 days", "Last 90 days", "Year to date"].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Sections to Include</label>
                  <div className="space-y-2">
                    {selectedReport.sections.map(s => (
                      <label key={s} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => toggleSection(s)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedSections.includes(s)
                              ? "bg-primary border-primary"
                              : "border-border group-hover:border-primary/50"
                          }`}
                        >
                          {selectedSections.includes(s) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={selectedSections.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(59,91,219,0.3)]"
            >
              <FileBarChart className="w-4 h-4" />
              Generate {selectedReport.name}
            </button>
          </div>

          {/* Preview card */}
          <div className="bg-muted/30 border border-border rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Report Preview</p>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-1/2" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}
              </div>
              <div className="mt-3 space-y-1">
                {[...Array(5)].map((_, i) => <div key={i} className="h-2 bg-muted rounded" style={{ width: `${70 + i * 5}%` }} />)}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 space-y-1">
              {selectedSections.map(s => (
                <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === "generating" && (
        <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold text-base">Generating {selectedReport?.name}...</p>
            <p className="text-sm text-muted-foreground mt-1">Compiling security data and building your report</p>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono text-center mt-2">{progress}%</p>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 text-center">
            {progress >= 20 && <p className="text-emerald-500">✓ Security data loaded</p>}
            {progress >= 45 && <p className="text-emerald-500">✓ Risk metrics calculated</p>}
            {progress >= 70 && <p className="text-emerald-500">✓ Charts and tables compiled</p>}
            {progress >= 90 && <p className="text-emerald-500">✓ QuantifySec branding applied</p>}
          </div>
        </div>
      )}

      {/* Step 4: Preview + Download */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-5 h-5" /> Report generated successfully
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(59,91,219,0.35)]"
              >
                <Download className="w-4 h-4" /> Download HTML Report
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2 bg-muted/20">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-2">{selectedReport?.name} — Preview</span>
            </div>
            <iframe
              srcDoc={generatedHTML}
              className="w-full border-0"
              style={{ height: "650px" }}
              title="Report Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}
