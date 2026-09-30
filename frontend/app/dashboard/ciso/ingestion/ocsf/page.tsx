"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, FileJson, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Shield, Clock, Activity,
  BarChart2, Eye, Play, RefreshCw, Download, Info, Zap,
  AlertCircle, Server, Database, Lock, TrendingUp,
  FileCheck, X, ChevronDown, ChevronUp
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type Stage = "upload" | "validating" | "preview" | "ingesting" | "complete"

const MOCK_CHECKS = [
  { label: "Schema detected", status: "ok" as const, detail: "OCSF v1.1.0 schema identified" },
  { label: "Structure valid", status: "ok" as const, detail: "All top-level fields present" },
  { label: "Required fields present", status: "ok" as const, detail: "class_uid, category_uid, time, severity_id" },
  { label: "Optional-field coverage", status: "warn" as const, detail: "17 events missing optional fields (actor, dst_endpoint)" },
  { label: "Malformed records", status: "fail" as const, detail: "3 events have unparseable JSON — will be rejected" },
]

const MOCK_ISSUES = [
  { line: 4821, field: "time", message: "Invalid ISO-8601 timestamp", raw: '{"class_uid":3001,"time":"2026/09/26 09:31"...}' },
  { line: 9204, field: "severity_id", message: "Value out of range (expected 0-6, got 9)", raw: '{"class_uid":2001,"severity_id":9...}' },
  { line: 15006, field: "dst_endpoint.ip", message: "IPv6 in IPv4 field", raw: '{"class_uid":4001,"dst_endpoint":{"ip":"::1"}...}' },
]

const SEV_DATA = [
  { name: "Critical", count: 42, color: "#FF3B30" },
  { name: "High", count: 284, color: "#FF6B35" },
  { name: "Medium", count: 1203, color: "#FFB020" },
  { name: "Low", count: 4821, color: "#00C878" },
  { name: "Info", count: 12079, color: "#00B8A9" },
]

const EVENT_CLASSES = ["Authentication", "Network Activity", "File Activity", "Vulnerability Finding", "Security Finding"]
const DATA_SOURCES = ["Firewall", "Endpoint EDR", "Cloud (AWS)", "Identity Provider", "Application WAF"]

const INGESTION_STEPS = [
  "Parsing", "OCSF validation", "Normalization",
  "Event classification", "Risk analysis", "Correlation", "Dashboard indexing"
]

const STAGES: Stage[] = ["upload", "validating", "preview", "ingesting", "complete"]
const STAGE_LABELS = ["Upload", "Validate", "Preview", "Ingest", "Complete"]

function CheckIcon({ status }: { status: "ok" | "warn" | "fail" }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
  return <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
}

function SevBar({ name, count, total, color }: { name: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono w-14 text-right" style={{ color: "var(--muted-foreground)" }}>{name}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--muted)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono w-12" style={{ color: "var(--foreground)" }}>{count.toLocaleString()}</span>
    </div>
  )
}

function UploadStage({ onFiles }: { onFiles: (f: File[]) => void }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files) onFiles(Array.from(e.dataTransfer.files))
  }
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--qs-green)" }}>
          <Database className="w-3.5 h-3.5" />OCSF INGESTION PIPELINE
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>Import Security Data</h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--muted-foreground)" }}>
          Ingest OCSF security events and transform them into actionable security intelligence.
        </p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
        style={{ backgroundColor: "rgba(0,200,120,0.05)", borderColor: "var(--qs-green-border)" }}>
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--qs-green)" }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--qs-green)" }}>Secure Ingestion Pipeline</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            All security data is processed in an isolated environment. Role-restricted: CISO, SECURITY_ANALYST, ADMIN only. Encrypted in transit and at rest.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
        className="relative flex flex-col items-center justify-center gap-5 min-h-[300px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200"
        style={{
          borderColor: drag ? "var(--qs-green)" : "var(--border)",
          backgroundColor: drag ? "rgba(0,200,120,0.04)" : "var(--card)"
        }}
      >
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(var(--foreground) 1px,transparent 1px),linear-gradient(90deg,var(--foreground) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex flex-col items-center gap-4 text-center px-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center border transition-all"
            style={{ backgroundColor: drag ? "var(--qs-green-dim)" : "var(--muted)", borderColor: drag ? "var(--qs-green-border)" : "var(--border)" }}>
            <Upload className="w-9 h-9" style={{ color: drag ? "var(--qs-green)" : "var(--muted-foreground)", transform: drag ? "translateY(-4px)" : "none", transition: "all 0.2s" }} />
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: drag ? "var(--qs-green)" : "var(--foreground)" }}>
              {drag ? "Release to upload" : "Drop the 4 required JSON files here"}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>or click to browse your filesystem</p>
          </div>
          <div className="flex items-center gap-2">
            {["OCSF JSON", "JSONL"].map(fmt => (
              <span key={fmt} className="text-xs font-mono px-2.5 py-1 rounded-full border"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--muted)" }}>{fmt}</span>
            ))}
          </div>
        </div>
        <input ref={ref} type="file" multiple className="hidden" accept=".json,.jsonl"
          onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))} />
      </div>

      <div className="flex gap-3">
        <button onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--qs-green)", color: "#000" }}>
          <Upload className="w-4 h-4" />Browse Files
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <Download className="w-4 h-4" />Download Sample OCSF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileJson, title: "OCSF JSON", desc: "Open Cybersecurity Schema Framework v1.1.0", ready: true },
          { icon: Database, title: "CEF / LEEF", desc: "Common Event Format · Log Event Extended Format", ready: false },
          { icon: Shield, title: "STIX / TAXII", desc: "Structured threat intelligence exchange", ready: false },
        ].map(({ icon: Icon, title, desc, ready }) => (
          <div key={title} className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)", opacity: ready ? 1 : 0.5 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: ready ? "var(--qs-green-dim)" : "var(--muted)" }}>
              <Icon className="w-4 h-4" style={{ color: ready ? "var(--qs-green)" : "var(--muted-foreground)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</p>
                {!ready && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>PLANNED</span>}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ValidatingStage({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-fade-in">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 animate-spin"
          style={{ borderColor: "transparent", borderTopColor: "var(--qs-green)" }} />
        <div className="absolute inset-3 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--qs-green-dim)" }}>
          <Shield className="w-6 h-6" style={{ color: "var(--qs-green)" }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Validating {count} Files</p>
        <p className="text-sm mt-1 font-mono" style={{ color: "var(--muted-foreground)" }}>Checking required schema...</p>
      </div>
      <div className="flex flex-col gap-2 w-64">
        {["Detecting format...", "Parsing JSON structure...", "Checking OCSF schema...", "Counting events...", "Validating field types..."].map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--qs-green)", animationDelay: `${i * 200}ms` }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewStage({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  const [showIssues, setShowIssues] = useState(false)
  const total = SEV_DATA.reduce((s, x) => s + x.count, 0)
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "var(--qs-green)" }}>
            <FileCheck className="w-3.5 h-3.5" />FILE VALIDATED
          </div>
          <h2 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>Ingestion Preview</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Review detected data before starting ingestion</p>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <RefreshCw className="w-3 h-3" />Change File
        </button>
      </div>

      <div className="p-5 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: "File", value: "security_events.json", sub: "24.8 MB" },
            { label: "Format", value: "OCSF JSON", sub: "v1.1.0" },
            { label: "Events", value: "18,429", sub: null },
            { label: "Time Range", value: "26—27 Sep 2026", sub: "09:21 → 16:48" },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              <p className="text-sm font-semibold font-mono" style={{ color: "var(--foreground)" }}>{value}</p>
              {sub && <p className="text-xs" style={{ color: "var(--qs-cyan)" }}>{sub}</p>}
            </div>
          ))}
        </div>

        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>Validation Status</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MOCK_CHECKS.map(check => (
              <div key={check.label} className="flex items-start gap-2.5 p-2.5 rounded-lg"
                style={{ backgroundColor: "var(--muted)" }}>
                <CheckIcon status={check.status} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{check.label}</p>
                  {check.detail && <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{check.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t mt-4 pt-4" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setShowIssues(!showIssues)} className="flex items-center justify-between w-full text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" style={{ color: "var(--qs-red)" }} />
              <p className="text-xs font-bold" style={{ color: "var(--qs-red)" }}>3 Validation Issues Detected</p>
            </div>
            {showIssues
              ? <ChevronUp className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              : <ChevronDown className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />}
          </button>
          {showIssues && (
            <div className="mt-3 space-y-2">
              {MOCK_ISSUES.map((issue, i) => (
                <div key={i} className="p-3 rounded-lg border"
                  style={{ borderColor: "rgba(255,59,48,0.2)", backgroundColor: "rgba(255,59,48,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(255,59,48,0.15)", color: "var(--qs-red)" }}>Line {issue.line}</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>field: {issue.field}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{issue.message}</p>
                  <p className="text-[11px] font-mono mt-1 truncate" style={{ color: "var(--muted-foreground)" }}>{issue.raw}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: "18,429", color: "var(--foreground)" },
          { label: "Valid Events", value: "18,412", color: "var(--qs-green)" },
          { label: "Invalid Events", value: "17", color: "var(--qs-amber)" },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>Severity Distribution</p>
          <div className="space-y-2.5 mb-5">
            {SEV_DATA.map(s => <SevBar key={s.name} name={s.name} count={s.count} total={total} color={s.color} />)}
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SEV_DATA} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {SEV_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>Event Classes</p>
            <div className="space-y-1.5">
              {EVENT_CLASSES.map(ec => (
                <div key={ec} className="flex items-center gap-2 text-xs py-1 px-2 rounded" style={{ backgroundColor: "var(--muted)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--qs-cyan)" }} />
                  <span style={{ color: "var(--foreground)" }}>{ec}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>Data Sources</p>
            <div className="space-y-1.5">
              {DATA_SOURCES.map(src => (
                <div key={src} className="flex items-center gap-2 text-xs py-1 px-2 rounded" style={{ backgroundColor: "var(--muted)" }}>
                  <Server className="w-3 h-3 flex-shrink-0" style={{ color: "var(--qs-green)" }} />
                  <span style={{ color: "var(--foreground)" }}>{src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onStart} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
          style={{ backgroundColor: "var(--qs-green)", color: "#000" }}>
          <Play className="w-4 h-4" />Start Ingestion
        </button>
        <button onClick={() => setShowIssues(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          <Eye className="w-4 h-4" />Review Issues (3)
        </button>
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          style={{ color: "var(--muted-foreground)" }}>
          <X className="w-4 h-4" />Cancel
        </button>
      </div>
    </div>
  )
}

function IngestingStage({ files, onComplete }: { files: File[], onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timeIv = setInterval(() => setElapsed(e => e + 1), 1000)
    
    // Fake progress while waiting for real upload
    const progIv = setInterval(() => {
      setProgress(p => {
        const next = p < 90 ? p + Math.random() * 5 : p
        setStep(Math.min(Math.floor(next / (100 / INGESTION_STEPS.length)), INGESTION_STEPS.length - 1))
        return next
      })
    }, 500)

    const formData = new FormData()
    files.forEach(f => {
      const name = f.name.toLowerCase()
      if (name.includes("asset")) formData.append("asset_business_context", f)
      else if (name.includes("finan")) formData.append("financial_parameters", f)
      else if (name.includes("histor")) formData.append("historical_risk_trends", f)
      else formData.append("ocsf_vulnerability_findings", f)
    })

    // Safety fallback
    if (!formData.has("asset_business_context") && files[0]) formData.append("asset_business_context", files[0])
    if (!formData.has("financial_parameters") && files[1]) formData.append("financial_parameters", files[1])
    if (!formData.has("historical_risk_trends") && files[2]) formData.append("historical_risk_trends", files[2])
    if (!formData.has("ocsf_vulnerability_findings") && files[3]) formData.append("ocsf_vulnerability_findings", files[3])

    fetch("/api/run-pipeline/upload", {
      method: "POST",
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error("Upload failed")
      return res.json()
    })
    .then(() => {
      clearInterval(progIv)
      setProgress(100)
      setStep(INGESTION_STEPS.length - 1)
      setTimeout(onComplete, 800)
    })
    .catch(err => {
      console.error(err)
      alert("Ingestion failed. Ensure backend is running and files are valid.")
      clearInterval(progIv)
    })

    return () => {
      clearInterval(timeIv)
      clearInterval(progIv)
    }
  }, [files, onComplete])

  const processed = Math.round((progress / 100) * 18429)
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-2"
          style={{ color: "var(--qs-amber)" }}>
          <Activity className="w-3.5 h-3.5 animate-pulse" />INGESTING SECURITY DATA
        </div>
        <h2 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>Processing Events</h2>
        <p className="text-sm mt-1 font-mono" style={{ color: "var(--muted-foreground)" }}>security_events.json · Do not close this window</p>
      </div>

      <div className="p-8 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-5xl font-black font-mono" style={{ color: "var(--qs-green)" }}>{Math.round(progress)}%</p>
            <p className="text-sm font-mono mt-1" style={{ color: "var(--muted-foreground)" }}>
              {processed.toLocaleString()} / 18,429 events
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Elapsed</p>
            <p className="text-lg font-mono font-bold" style={{ color: "var(--foreground)" }}>
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
            </p>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: "var(--qs-green)" }} />
        </div>
      </div>

      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>Processing Pipeline</p>
        <div className="space-y-3">
          {INGESTION_STEPS.map((label, i) => {
            const done = i < step, active = i === step
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: done ? "var(--qs-green)" : active ? "var(--qs-green-dim)" : "var(--muted)",
                    border: active ? "2px solid var(--qs-green)" : "none"
                  }}>
                  {done
                    ? <span className="text-[9px] font-black" style={{ color: "#000" }}>✓</span>
                    : active
                    ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--qs-green)" }} />
                    : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--border)" }} />}
                </div>
                <span className="text-sm" style={{
                  color: done ? "var(--qs-green)" : active ? "var(--foreground)" : "var(--muted-foreground)",
                  fontWeight: active ? 600 : 400
                }}>{label}</span>
                {active && <span className="text-xs font-mono animate-pulse" style={{ color: "var(--qs-green)" }}>Processing...</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,176,32,0.06)", border: "1px solid rgba(255,176,32,0.2)" }}>
        <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--qs-amber)" }} />
        <span style={{ color: "var(--qs-amber)" }}>
          Sending files directly to the engine-changes FastAPI backend for Monte Carlo and PSO processing.
        </span>
      </div>
    </div>
  )
}

function CompleteStage({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 p-6 rounded-2xl border"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--qs-green-border)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--qs-green-dim)", border: "2px solid var(--qs-green)" }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: "var(--qs-green)" }} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--qs-green)" }}>INGESTION COMPLETE</div>
          <h2 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>18,429 Events Processed</h2>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm" style={{ color: "var(--qs-green)" }}>✓ 18,412 valid</span>
            <span className="text-sm" style={{ color: "var(--qs-amber)" }}>⚠ 17 rejected</span>
            <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>ID: OCSF-20260927-001</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Duration</p>
          <p className="text-xl font-mono font-black" style={{ color: "var(--foreground)" }}>1m 42s</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" style={{ color: "var(--qs-green)" }} />
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Security Findings</p>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded ml-1"
            style={{ backgroundColor: "var(--qs-green-dim)", color: "var(--qs-green)" }}>AUTO-DETECTED</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Critical", value: 12, color: "var(--qs-red)" },
            { label: "High", value: 48, color: "#FF6B35" },
            { label: "Medium", value: 214, color: "var(--qs-amber)" },
            { label: "Incidents", value: 7, color: "var(--qs-red)" },
            { label: "Risk Assets", value: 23, color: "var(--qs-amber)" },
            { label: "Exposure", value: "$420K", color: "var(--qs-green)" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--qs-amber)" }} />
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Detected Risks</p>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,176,32,0.1)", color: "var(--qs-amber)" }}>DEMO ANALYSIS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "PUBLIC API ABUSE", sev: "var(--qs-red)", sevBg: "rgba(255,59,48,0.04)", sevBorder: "rgba(255,59,48,0.25)", desc: "142 suspicious requests · 3 affected endpoints · 2 anomalous IPs", score: "87/100" },
            { title: "BRUTE-FORCE AUTH", sev: "var(--qs-amber)", sevBg: "rgba(255,176,32,0.04)", sevBorder: "rgba(255,176,32,0.25)", desc: "284 failed logins · 12 accounts · 3 privilege escalations", score: "74/100" },
            { title: "SCORE IMPACT", sev: "var(--qs-green)", sevBg: "rgba(0,200,120,0.03)", sevBorder: "rgba(0,200,120,0.2)", desc: "Net change to security posture score after analysis run", score: "-3.2" },
          ].map(r => (
            <div key={r.title} className="p-4 rounded-xl border"
              style={{ borderColor: r.sevBorder, backgroundColor: r.sevBg }}>
              <p className="text-xs font-bold mb-2" style={{ color: r.sev }}>{r.title}</p>
              <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{r.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>Score</span>
                <span className="text-xl font-black font-mono" style={{ color: r.sev }}>{r.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" style={{ color: "var(--qs-cyan)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>CFO Intelligence Generated</p>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
          Business-level risk summary has been pushed to the CFO dashboard. CFO sees financial impact — not raw OCSF events.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Cyber Risk Exposure", value: "$420K" },
            { label: "Potential Impact", value: "$680K" },
            { label: "Risk Trend", value: "↓ 12%" },
            { label: "Investment Rec.", value: "$45K" },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{m.label}</p>
              <p className="text-base font-black" style={{ color: "var(--qs-green)" }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href="/dashboard/ciso/incidents"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ backgroundColor: "var(--qs-green)", color: "#000" }}>
          <Zap className="w-4 h-4" />View Incidents
        </a>
        <a href="/dashboard/ciso/risk-intelligence"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          <TrendingUp className="w-4 h-4" />View Risks
        </a>
        <a href="/dashboard/ciso/ingestion/events"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          <Eye className="w-4 h-4" />Explore Events
        </a>
        <a href="/dashboard/ciso/reports"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-muted transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
          <BarChart2 className="w-4 h-4" />Generate Report
        </a>
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          style={{ color: "var(--muted-foreground)" }}>
          <Upload className="w-4 h-4" />New Import
        </button>
      </div>
    </div>
  )
}

export default function OCSFImportPage() {
  const [stage, setStage] = useState<Stage>("upload")
  const [file, setFiles] = useState<File[]>([])
  const curIdx = STAGES.indexOf(stage)

  const handleFiles = (f: File[]) => {
    if (f.length < 4) {
      alert("Please upload exactly 4 JSON files.")
      return
    }
    setFiles(f)
    setStage("validating")
    setTimeout(() => setStage("preview"), 1800)
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
        <span>Security Operations</span>
        <ChevronRight className="w-3 h-3" />
        <span>Data Ingestion</span>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>OCSF Import</span>
      </nav>

      {stage !== "upload" && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: i < curIdx ? "var(--qs-green)" : s === stage ? "var(--qs-green-dim)" : "var(--muted)",
                    border: s === stage ? "2px solid var(--qs-green)" : "none",
                    color: i < curIdx ? "#000" : s === stage ? "var(--qs-green)" : "var(--muted-foreground)"
                  }}>
                  {i < curIdx ? "✓" : i + 1}
                </div>
                <span className="text-xs hidden sm:block"
                  style={{ color: s === stage ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: s === stage ? 600 : 400 }}>
                  {STAGE_LABELS[i]}
                </span>
              </div>
              {i < 4 && <div className="w-5 h-px" style={{ backgroundColor: i < curIdx ? "var(--qs-green)" : "var(--border)" }} />}
            </div>
          ))}
        </div>
      )}

      {stage === "upload" && <UploadStage onFiles={handleFiles} />}
      {stage === "validating" && <ValidatingStage count={file.length} />}
      {stage === "preview" && <PreviewStage onStart={() => setStage("ingesting")} onReset={() => { setFiles([]); setStage("upload") }} />}
      {stage === "ingesting" && <IngestingStage files={file} onComplete={() => setStage("complete")} />}
      {stage === "complete" && <CompleteStage onReset={() => { setFiles([]); setStage("upload") }} />}
    </div>
  )
}
