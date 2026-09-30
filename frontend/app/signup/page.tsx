"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Eye, EyeOff, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const roles = [
  { id: "ciso", label: "CISO", description: "Chief Information Security Officer", icon: "🛡️" },
  { id: "cfo", label: "CFO", description: "Chief Financial Officer", icon: "💼" },
  { id: "analyst", label: "Security Analyst", description: "Security Operations Team", icon: "🔍" },
  { id: "admin", label: "Administrator", description: "Platform Administration", icon: "⚙️" },
  { id: "viewer", label: "Viewer", description: "Read-only Access", icon: "👁️" },
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!selectedRole) errs.role = "Please select your role"
    return errs
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (!formData.firstName.trim()) errs.firstName = "First name is required"
    if (!formData.lastName.trim()) errs.lastName = "Last name is required"
    if (!formData.email.trim()) errs.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Enter a valid email"
    if (!formData.company.trim()) errs.company = "Company name is required"
    if (!formData.password) errs.password = "Password is required"
    else if (formData.password.length < 8) errs.password = "Password must be at least 8 characters"
    return errs
  }

  const handleNext = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateStep2()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)

    // Route based on role
    if (selectedRole === "cfo") router.push("/dashboard/cfo")
    else if (selectedRole === "admin") router.push("/dashboard/admin")
    else router.push("/dashboard/ciso")
  }

  const passwordStrength = () => {
    const p = formData.password
    if (!p) return { strength: 0, label: "" }
    let strength = 0
    if (p.length >= 8) strength++
    if (/[A-Z]/.test(p)) strength++
    if (/[0-9]/.test(p)) strength++
    if (/[^A-Za-z0-9]/.test(p)) strength++
    const labels = ["", "Weak", "Fair", "Strong", "Very Strong"]
    const colors = ["", "bg-rose-500", "bg-amber-500", "bg-accent", "bg-accent"]
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const pw = passwordStrength()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background">
      {/* Header */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">QuantifySec</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Already have an account? <span className="text-primary font-medium">Sign in</span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Progress */}
        <div className="flex border-b border-border">
          {[
            { n: 1, label: "Role" },
            { n: 2, label: "Account" },
          ].map((s) => (
            <div
              key={s.n}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                step === s.n
                  ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : step > s.n
                  ? "text-accent bg-accent/5"
                  : "text-muted-foreground"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.n ? "bg-accent text-white" : step === s.n ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
              </span>
              {s.label}
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Select your role</h1>
                <p className="text-muted-foreground text-sm">We'll customize QuantifySec for your specific responsibilities.</p>
              </div>

              {errors.role && (
                <p className="text-rose-500 text-sm">{errors.role}</p>
              )}

              <div className="space-y-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedRole === role.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {selectedRole === role.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <Button onClick={handleNext} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" noValidate>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm">
                  Signing up as <span className="font-medium text-primary">{roles.find((r) => r.id === selectedRole)?.label}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Alex"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  {errors.firstName && <p className="text-rose-500 text-xs">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Johnson"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  {errors.lastName && <p className="text-rose-500 text-xs">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">Work email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@company.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                {errors.email && <p className="text-rose-500 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="company" className="text-sm font-medium">Company name</label>
                <input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                {errors.company && <p className="text-rose-500 text-xs">{errors.company}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 pr-11 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pw.strength ? pw.color : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${pw.strength >= 3 ? "text-accent" : pw.strength >= 2 ? "text-amber-500" : "text-rose-500"}`}>
                      {pw.label}
                    </p>
                  </div>
                )}
                {errors.password && <p className="text-rose-500 text-xs">{errors.password}</p>}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold gap-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
