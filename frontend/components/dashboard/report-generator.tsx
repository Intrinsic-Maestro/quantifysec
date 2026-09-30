"use client"

import { useState, useEffect } from "react"
import { X, FileText, CheckCircle2, Download, Printer, Loader2, BarChart, ShieldAlert } from "lucide-react"

interface ReportGeneratorProps {
  isOpen: boolean
  onClose: () => void
  data: any
}

const REPORT_TYPES = [
  "Comprehensive QuantifySec Security Report",
  "Executive Security Report",
  "CISO Risk Report",
  "CFO Financial Risk Report",
  "Vulnerability & Exposure Report",
  "Asset Risk Report",
  "IAM Security Report",
  "OCSF Security Events Report",
  "Remediation Report"
]

const TIME_RANGES = [
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "Custom Range"
]

const SECTIONS = [
  { id: "exec_summary", label: "Executive Summary" },
  { id: "sec_posture", label: "Security Posture" },
  { id: "risk_analysis", label: "Risk Analysis" },
  { id: "financial_impact", label: "Financial Impact" },
  { id: "vulnerabilities", label: "Vulnerabilities" },
  { id: "assets", label: "Assets" },
  { id: "iam", label: "IAM" },
  { id: "sec_events", label: "Security Events" },
  { id: "threat_activity", label: "Threat Activity" },
  { id: "remediation_backlog", label: "Remediation Backlog" },
  { id: "risk_timeline", label: "Risk Timeline" },
  { id: "model_confidence", label: "Model Confidence" },
  { id: "calc_lineage", label: "Calculation Lineage" },
  { id: "data_quality", label: "Data Quality" },
  { id: "ingestion_sources", label: "Ingestion Sources" },
  { id: "recommendations", label: "Recommendations" },
  { id: "appendix", label: "Appendix / Raw Statistics" }
]

const GENERATION_STEPS = [
  "Collecting security data...",
  "Analyzing vulnerabilities...",
  "Calculating asset risk...",
  "Running financial risk calculations...",
  "Analyzing remediation opportunities...",
  "Building risk timeline...",
  "Generating report..."
]

export function ReportGeneratorModal({ isOpen, onClose, data }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0])
  const [timeRange, setTimeRange] = useState(TIME_RANGES[2])
  const [selectedSections, setSelectedSections] = useState<string[]>(SECTIONS.map(s => s.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isReady, setIsReady] = useState(false)

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false)
      setCurrentStep(-1)
      setIsReady(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isGenerating) {
      let step = 0
      setCurrentStep(step)
      
      const interval = setInterval(() => {
        step++
        if (step >= GENERATION_STEPS.length) {
          clearInterval(interval)
          setIsGenerating(false)
          setIsReady(true)
        } else {
          setCurrentStep(step)
        }
      }, 600) // 600ms per step
      
      return () => clearInterval(interval)
    }
  }, [isGenerating])

  if (!isOpen) return null

  const toggleSection = (id: string) => {
    setSelectedSections(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleGenerate = () => {
    setIsGenerating(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Generate Report</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Based on real ingested QuantifySec data.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 dashboard-scroll">
          
          {!isGenerating && !isReady && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Report Type</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {REPORT_TYPES.map(rt => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Time Range</label>
                  <select 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    {TIME_RANGES.map(tr => (
                      <option key={tr} value={tr}>{tr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Include Sections</label>
                  <button 
                    onClick={() => setSelectedSections(selectedSections.length === SECTIONS.length ? [] : SECTIONS.map(s => s.id))}
                    className="text-xs text-primary hover:underline"
                  >
                    {selectedSections.length === SECTIONS.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                  {SECTIONS.map(section => (
                    <label key={section.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSections.includes(section.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background group-hover:border-primary/50'}`}>
                        {selectedSections.includes(section.id) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Status Indicator */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-500">Ready to Generate</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Report will use live production data. <br/>
                    {data?.ingestion_metrics?.assets_loaded || 0} Assets, {data?.ciso_metrics?.total_active_vulnerabilities || 0} Vulnerabilities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
              <div className="space-y-4 w-full max-w-sm">
                {GENERATION_STEPS.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {idx < currentStep ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : idx === currentStep ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                    )}
                    <span className={`text-sm ${idx < currentStep ? 'text-muted-foreground' : idx === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isReady && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <FileText className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Report Ready</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
                Your {reportType} has been successfully generated using the latest ingested data.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-medium hover:bg-muted/80 transition-colors">
                  <BarChart className="w-4 h-4" /> Download CSV Appendix
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-medium hover:bg-muted/80 transition-colors" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>

              <button 
                onClick={() => {
                  setIsReady(false)
                  setCurrentStep(-1)
                }}
                className="mt-8 text-sm text-muted-foreground hover:text-foreground underline"
              >
                Generate another report
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        {!isGenerating && !isReady && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleGenerate}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
