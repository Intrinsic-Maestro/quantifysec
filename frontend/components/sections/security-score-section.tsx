"use client"

export default function SecurityScoreSection() {
  const score = 74
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (score / 100) * circumference

  const factors = [
    { label: "Vulnerability Remediation", value: 82, weight: "25%" },
    { label: "Patch Management", value: 71, weight: "20%" },
    { label: "Access Control", value: 88, weight: "20%" },
    { label: "Incident Response", value: 69, weight: "15%" },
    { label: "Security Awareness", value: 76, weight: "10%" },
    { label: "Compliance", value: 80, weight: "10%" },
  ]

  function getScoreColor(v: number) {
    if (v >= 80) return "#0CA678"
    if (v >= 65) return "#F59E0B"
    return "#F43F5E"
  }

  return (
    <section className="relative py-24 px-4" id="score">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <p className="section-label">Security Score</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
            One Number That Tells
            <br />
            <span className="gradient-text">The Whole Story</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The QuantifySec Security Score is a weighted composite of your security across six domains —
            updated continuously, explainable at every level.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Score Ring */}
          <div className="flex flex-col items-center gap-8">
            <div className="relative w-52 h-52">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background ring */}
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/50"
                />
                {/* Score arc */}
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={score >= 80 ? "#0CA678" : score >= 65 ? "#F59E0B" : "#F43F5E"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-foreground">{score}</span>
                <span className="text-sm text-muted-foreground font-medium">/100</span>
                <span className="text-xs font-semibold text-amber-500 mt-1">Moderate</span>
              </div>
            </div>

            {/* Industry Benchmark */}
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Industry Average (Financial Services)</p>
              <p className="text-2xl font-bold text-foreground">68 <span className="text-sm font-normal text-accent">↑ You score 9% above average</span></p>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Score Breakdown</h3>
            {factors.map((f) => (
              <div key={f.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Weight: {f.weight}</span>
                    <span className="font-bold w-8 text-right" style={{ color: getScoreColor(f.value) }}>
                      {f.value}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${f.value}%`,
                      backgroundColor: getScoreColor(f.value),
                    }}
                  />
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground pt-2">
              * Score calculated using NIST CSF, CIS Controls, and industry threat data. Demo values shown.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
