"use client";

import React, { useState, useEffect, useRef } from "react";

// ==========================================
// MOCK DATA (CFO Dashboard)
// ==========================================
const CFO_MOCK_DATA = {
  kpis: {
    capitalAtRisk: 180,
    riskNeutralized: "3652900.64",
    budgetDeployed: 75,
    roi: "11.41",
    exposureReduction: "59.8%"
  },
  trend: {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    values: [100, 98, 95, 95, 95, 95, 95, 95, 95, 95, 90, 25]
  },
  scatterPoints: Array.from({ length: 60 }).map((_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 80 + (i * 0.5),
    selected: i > 40
  })),
  selectedControls: [
    { id: "FINDING-dd5b...", name: "Patch Vuln FINDING- (CVSS 2.5)", cost: "1.25", reduction: "60881.68", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-6666...", name: "Patch Vuln FINDING- (CVSS 2.5)", cost: "1.25", reduction: "60881.68", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-6deb...", name: "Patch Vuln FINDING- (CVSS 2.8)", cost: "1.4", reduction: "68187.48", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-f568...", name: "Patch Vuln FINDING- (CVSS 2.4)", cost: "1.2", reduction: "58446.41", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-6cb2...", name: "Patch Vuln FINDING- (CVSS 2.4)", cost: "1.2", reduction: "58446.41", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-c329...", name: "Patch Vuln FINDING- (CVSS 3.1)", cost: "1.55", reduction: "75493.28", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-b45e...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", efficiency: "48705.34", roi: "48705.34x" },
    { id: "FINDING-2675...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", efficiency: "48705.34", roi: "48705.34x" },
  ],
  deferredControls: [
    { rank: "#1", id: "FINDING-a16d...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
    { rank: "#2", id: "FINDING-f4b3...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
    { rank: "#3", id: "FINDING-7d4a...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
    { rank: "#4", id: "FINDING-354f...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
    { rank: "#5", id: "FINDING-a670...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
    { rank: "#6", id: "FINDING-3850...", name: "Patch Vuln FINDING- (CVSS 5.5)", cost: "2.75", reduction: "133939.69", roi: "48705.34x" },
  ]
};

// ==========================================
// MOCK DATA (CISO Dashboard)
// ==========================================
const CISO_MOCK_DATA = {
  heatmap: Array.from({ length: 120 }).map((_, i) => ({
    id: Math.random().toString(16).substring(2, 6),
    status: i < 9 ? 'deployed' : (i < 25 ? 'deferred' : 'none')
  })).sort(() => Math.random() - 0.5),
  deployedControls: [
    { status: "LIVE", id: "FINDING-dd5b...", name: "Patch Vuln FINDING- (CVSS 2.5)", category: "Remediation", efficiency: "48705.34", weight: 45 },
    { status: "LIVE", id: "FINDING-6666...", name: "Patch Vuln FINDING- (CVSS 2.5)", category: "Remediation", efficiency: "48705.34", weight: 45 },
    { status: "LIVE", id: "FINDING-6deb...", name: "Patch Vuln FINDING- (CVSS 2.8)", category: "Remediation", efficiency: "48705.34", weight: 51 },
    { status: "LIVE", id: "FINDING-f568...", name: "Patch Vuln FINDING- (CVSS 2.4)", category: "Remediation", efficiency: "48705.34", weight: 44 },
    { status: "LIVE", id: "FINDING-6cb2...", name: "Patch Vuln FINDING- (CVSS 2.4)", category: "Remediation", efficiency: "48705.34", weight: 44 },
  ],
  deferredControls: [
    { rank: "#1", id: "FINDING-a16d...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
    { rank: "#2", id: "FINDING-f4b3...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
    { rank: "#3", id: "FINDING-7d4a...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
    { rank: "#4", id: "FINDING-354f...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
    { rank: "#5", id: "FINDING-a670...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
    { rank: "#6", id: "FINDING-3850...", name: "Patch Vuln FINDING- (CVSS 5.5)", category: "Remediation", efficiency: "48705.34", weight: 56 },
  ]
};

const CATEGORY_COLORS: Record<string, string> = {
  Identity: "#a78bfa",
  Endpoint: "#f59e0b",
  Network: "#60a5fa",
  Data: "#10b981",
  People: "#f472b6",
  Monitoring: "#22d3ee",
  Assessment: "#c084fc",
  Email: "#fb923c",
  Cloud: "#818cf8",
  Physical: "#94a3b8",
  Response: "#fbbf24",
  Remediation: "#a78bfa",
  Application: "#fb7185",
};

interface ControlItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  risk_reduction: number;
  efficiency?: number;
  priority_rank?: number;
}

interface PipelineResponse {
  selected_controls: ControlItem[];
  deferred_controls: ControlItem[];
  total_cost: number;
  total_risk_reduction: number;
  budget: number;
  status: string;
  solver_time_seconds: number;
  financial?: {
    capital_at_risk_before: number;
    capital_at_risk_after: number;
    portfolio_roi: number;
  };
}

export default function QuantifySecApp() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://quantifysec-production.up.railway.app";

  const [currentView, setCurrentView] = useState<string>("home");
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Navbar dynamic scroll states
  const [navVisible, setNavVisible] = useState<boolean>(true);
  const [isLight, setIsLight] = useState<boolean>(false);

  // Forms & MFA
  const [signupForm, setSignupForm] = useState({ name: "", email: "", company: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [otpInput, setOtpInput] = useState<string>("");
  const [mfaError, setMfaError] = useState<string>("");
  const [pendingNavigation, setPendingNavigation] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // OCSF Data Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [knapsackData, setKnapsackData] = useState<PipelineResponse>({
    selected_controls: [
      { id: "C01", name: "Multi-Factor Authentication (MFA)", category: "Identity", cost: 8, risk_reduction: 35, efficiency: 4.38 },
      { id: "C02", name: "Endpoint Detection & Response (EDR)", category: "Endpoint", cost: 15, risk_reduction: 42, efficiency: 2.80 },
      { id: "C03", name: "Next-Gen Firewall", category: "Network", cost: 20, risk_reduction: 38, efficiency: 1.90 },
      { id: "C04", name: "Backup & Recovery System", category: "Data", cost: 12, risk_reduction: 28, efficiency: 2.33 },
      { id: "C05", name: "Security Awareness Training", category: "People", cost: 5, risk_reduction: 22, efficiency: 4.40 },
    ],
    deferred_controls: [
      { id: "C11", name: "Encryption at Rest", category: "Data", cost: 7, risk_reduction: 18, efficiency: 2.57, priority_rank: 1 },
      { id: "C07", name: "Vulnerability Management", category: "Assessment", cost: 10, risk_reduction: 25, efficiency: 2.50, priority_rank: 2 },
      { id: "C23", name: "Mobile Device Management (MDM)", category: "Endpoint", cost: 7, risk_reduction: 17, efficiency: 2.43, priority_rank: 3 },
      { id: "C16", name: "Intrusion Detection System (IDS)", category: "Network", cost: 8, risk_reduction: 19, efficiency: 2.38, priority_rank: 4 },
    ],
    total_cost: 75,
    total_risk_reduction: 251,
    budget: 75,
    status: "Optimal",
    solver_time_seconds: 0.0247,
    financial: {
      capital_at_risk_before: 180,
      capital_at_risk_after: 71,
      portfolio_roi: 11.41
    }
  });

  // Browser History Management
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const validViews = ["home", "auth", "mfa", "cfo-dashboard", "ciso-dashboard"];

    if (hash && validViews.includes(hash)) {
      setCurrentView(hash);
      window.history.replaceState({ view: hash }, "", `#${hash}`);
    } else {
      window.history.replaceState({ view: "home" }, "", "#home");
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        setIsLight(false);
      } else {
        const fallbackHash = window.location.hash.replace("#", "") || "home";
        setCurrentView(fallbackHash);
        setIsLight(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (view: string) => {
    setCurrentView(view);
    setIsLight(false);
    window.history.pushState({ view }, "", `#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dynamic Scroll Handler
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 150) {
        setNavVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY = currentScrollY;

      if (currentView === "home") {
        const solutionSection = document.getElementById("section-solution");
        if (solutionSection) {
          const rect = solutionSection.getBoundingClientRect();
          setIsLight(rect.top < window.innerHeight * 0.4);
        }
      } else {
        setIsLight(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentView]);

  // Sync Landing Table with Railway Pipeline
  useEffect(() => {
    async function fetchOptimizationData() {
      try {
        let response = await fetch(`${backendBaseUrl}/api/run-pipeline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (response.status === 405) {
          response = await fetch(`${backendBaseUrl}/api/run-pipeline`, { method: "GET" });
        }
        if (response.ok) {
          const apiData = await response.json();
          setKnapsackData(prev => ({ ...prev, ...apiData }));
        }
      } catch (err) {
        console.warn("Backend optimization pipeline offline or booting:", err);
      }
    }
    fetchOptimizationData();
  }, [backendBaseUrl]);

  // ==========================================
  // REAL BACKEND AUTHENTICATION WITH RESEND
  // ==========================================
  const triggerMfaFlow = async (email: string, targetDashboard: string, name?: string, company?: string) => {
    setIsSendingOtp(true);
    setMfaError("");
    setActiveEmail(email);

    try {
      const res = await fetch(`${backendBaseUrl}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // NEW — name/company now included. Both are undefined on login,
        // which the backend's OTPRequest model already treats as optional.
        body: JSON.stringify({ email, role: currentRole, name, company })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to dispatch verification code.");
      }

      setPendingNavigation(targetDashboard);
      setOtpInput("");
      navigate("mfa");
    } catch (err: any) {
      alert(err.message || "Could not connect to Railway backend.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) { alert("Please select your role."); return; }
    const name = signupForm.name.trim();
    setCurrentUserName(name ? `, ${name.split(" ")[0]}` : "");
    if (signupForm.company.trim()) {
      sessionStorage.setItem("quantifysec_company", signupForm.company.trim());
    }
    // NEW — name and company are now actually passed through, instead of
    // being collected by the form and silently discarded.
    triggerMfaFlow(
      signupForm.email,
      currentRole === "cfo" ? "cfo-dashboard" : "ciso-dashboard",
      signupForm.name.trim(),
      signupForm.company.trim()
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole) { alert("Please select your role."); return; }
    const email = loginForm.email.trim();
    setCurrentUserName(email ? `, ${email.split("@")[0]}` : "");
    triggerMfaFlow(loginForm.email, currentRole === "cfo" ? "cfo-dashboard" : "ciso-dashboard");
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");

    try {
      const res = await fetch(`${backendBaseUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail, otp: otpInput })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Invalid code. Verification failed.");
      }

      const data = await res.json();
      sessionStorage.setItem("quantifysec_jwt", data.access_token);
      navigate(pendingNavigation);
    } catch (err: any) {
      setMfaError(err.message);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem("quantifysec_jwt");
    setCurrentRole(null);
    setCurrentUserName("");
    setActiveEmail("");
    navigate("home");
  };

  // ==========================================
  // REAL OCSF FILE UPLOAD TO BACKEND
  // ==========================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const processOcsfData = async () => {
    if (!selectedFile) {
      alert("Please upload a valid JSON file first.");
      return;
    }
    setIsUploading(true);

    try {
      const token = sessionStorage.getItem("quantifysec_jwt");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${backendBaseUrl}/api/ingest-ocsf`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Backend failed to process telemetry file.");
      }

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFileName("");
    } catch (err: any) {
      alert(err.message || "Failed to parse file on Railway backend.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen">

      {/* FLOATING NAVBAR */}
      <div id="main-nav-wrapper" className={`fixed w-full top-6 z-40 px-4 md:px-6 flex justify-center transition-transform duration-300 ease-in-out ${navVisible ? "translate-y-0" : "-translate-y-36"}`}>
        <nav className={`w-full max-w-[1100px] backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center shadow-2xl transition-all duration-500 ${isLight ? "bg-white/85 border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.06)]" : "bg-[#09090b]/60 border border-white/10"}`}>
          <div className="flex-1 flex items-center justify-start">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("home")}>
              <div className={`transition-all duration-500 border rounded-md p-1 ${isLight ? "border-black/15 bg-black/5" : "border-white/20 bg-white/5"}`}>
                <svg className={`w-3.5 h-3.5 transition-all duration-500 ${isLight ? "text-gray-800" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className={`font-display font-bold text-[15px] tracking-widest uppercase mt-0.5 transition-all duration-500 ${isLight ? "text-[#09090b]" : "text-white"}`}>quantifysec</span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center gap-7 text-[13px] font-medium">
            {['Product', 'Solutions', 'Customers'].map((item) => (
              <button key={item} onClick={() => navigate("home")} className={`transition-all duration-300 hover:text-qviolet flex items-center gap-1.5 ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                {item}
                <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-end gap-2">
            {currentRole && currentView.includes('dashboard') ? (
              <div className="flex items-center gap-2 text-xs border border-white/10 rounded-xl pr-1 overflow-hidden">
                <div className="flex items-center gap-1.5 text-gray-400 px-3 py-1.5 bg-white/5 border-r border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  <span>{currentRole.toUpperCase()}</span>
                </div>
                <button onClick={signOut} className="text-gray-400 hover:text-white px-3 py-1.5 transition">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => navigate("auth")} className={`transition-all duration-300 px-4 py-2 rounded-xl text-[13px] font-semibold shadow-sm tracking-wide ${isLight ? "bg-[#09090b] text-white hover:bg-zinc-800" : "bg-white text-[#09090b] hover:bg-gray-200"}`}>
                Book a demo
              </button>
            )}
          </div>
        </nav>
      </div>

      <main id="app-container" className="relative z-10 w-full flex-1 flex flex-col pt-32">

        {/* ==================== HOME VIEW ==================== */}
        {currentView === "home" && (
          <section id="view-home" className="relative w-full flex flex-col items-center">
            <div className="min-h-[85vh] w-full flex flex-col justify-center items-center relative">
              <div className="max-w-4xl mx-auto px-6 text-center relative z-10 -mt-24">
                <div className="mb-6 flex justify-center items-center gap-3 text-sm tracking-[0.2em] font-medium text-gray-300 uppercase">
                  MEET QUANTIFYSEC
                </div>
                <h1 className="font-body text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.1] text-white">
                  Your Co-Worker for Every Cyber Decision
                </h1>
                <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10 font-body leading-relaxed">
                  QuantifySec quantifies cybersecurity risk in financial terms, helping teams prioritize security investments with confidence
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => navigate("auth")} className="bg-white text-[#09090b] px-6 py-3.5 rounded-full font-semibold text-[13px] transition hover:bg-gray-200 flex items-center gap-2.5 min-w-[150px] justify-center tracking-wide">
                    Dashboard Access
                  </button>
                </div>
              </div>
            </div>

            <div id="section-problem" className="w-full max-w-[1100px] mx-auto px-6 py-24 border-t border-white/5 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500">Security ROI</span> Disconnect
                </h2>
                <p className="text-gray-400 text-lg font-body leading-relaxed">
                  Organizations have limited cybersecurity budgets, but struggle to determine exactly which security investments will reduce the most financial risk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-8 rounded-2xl flex flex-col hover:bg-white/5 transition duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-qviolet group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-white">Unquantifiable Exposure</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow">Technical metrics like CVSS scores do not translate to board-level financial risk. You know you have gaps, but you don't know what they cost.</p>
                  <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-gray-500">RESULT: BLIND SPENDING</div>
                </div>
                <div className="glass-panel p-8 rounded-2xl flex flex-col hover:bg-white/5 transition duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-qamber group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-white">Capital Misallocation</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow">Companies frequently overfund compliance checklists while underfunding controls that prevent catastrophic monetary loss.</p>
                  <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-gray-500">RESULT: BUDGET WASTE</div>
                </div>
                <div className="glass-panel p-8 rounded-2xl flex flex-col hover:bg-white/5 transition duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-qemerald group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-3 text-white">Decision Paralysis</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow">When presented with thousands of active alerts, security teams lack the financial context needed to prioritize patches effectively.</p>
                  <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-gray-500">RESULT: DELAYED ACTION</div>
                </div>
              </div>
            </div>

            <div className="w-full relative z-10 pb-24 pt-[250px]" style={{ background: "linear-gradient(to bottom, #09090b 0px, #4c1d95 70px, #8b5cf6 150px, #ffffff 250px, #ffffff 100%)" }}>
              <div id="section-solution" className="w-full max-w-[1100px] mx-auto px-6 pb-32 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                  <h2 className="text-[#09090b] font-display text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    Meet Your AI <span className="text-qviolet">Risk Quantifier</span>
                  </h2>
                  <p className="text-gray-500 text-lg font-body leading-relaxed">
                    A swarm of AI Co-Workers that instantly close the loop from technical insight to actionable financial decision.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="ui-widget rounded-3xl p-8 lg:col-span-2 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-qviolet/20 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-qviolet animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Continious Threat Exposure Management</h4>
                          <span className="text-gray-400 text-xs font-mono">Live</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm font-medium mb-1 block">Total Financial Exposure Risk</span>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-mono font-bold text-white">$4.2M</span>
                        <span className="text-sm font-medium text-qemerald bg-qemerald/10 px-2 py-0.5 rounded-full">-12% this week</span>
                      </div>
                    </div>

                    <div className="w-full h-32 mt-6 relative border-b border-white/5 pb-4">
                      <div className="absolute inset-0 bg-qviolet/5 blur-2xl rounded-full" />
                      <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,80 Q50,60 100,70 T200,40 T300,50 T400,10 L400,100 L0,100 Z" fill="url(#lineGrad)" />
                        <path d="M0,80 Q50,60 100,70 T200,40 T300,50 T400,10" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="100" cy="70" r="4" fill="#a78bfa" />
                        <circle cx="300" cy="50" r="4" fill="#a78bfa" />
                        <circle cx="400" cy="10" r="5" fill="#fff" className="animate-pulse" />
                      </svg>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="bg-qviolet/10 border border-qviolet/20 rounded-xl p-3 flex justify-between items-center">
                        <span className="text-sm text-gray-200">Note: Estimation model based on live knapsack telemetry.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="ui-widget rounded-3xl p-6 flex flex-col relative overflow-hidden">
                      <span className="text-gray-400 text-sm font-medium mb-6 relative z-10">Security Posture Score</span>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="relative w-24 h-24">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                            <path className="text-qviolet" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-display font-bold text-white">78</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Strong</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">Target Score</div>
                          <div className="text-lg font-mono text-white mb-3">85/100</div>
                          <div className="text-xs text-qemerald flex items-center justify-end gap-1">+4 this month</div>
                        </div>
                      </div>
                    </div>

                    <div className="ui-widget rounded-3xl p-6 flex-grow flex flex-col">
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-gray-400 text-sm font-medium">Most Effective Controls</span>
                        <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">Focus Next</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-200">MFA Rollout</span><span className="text-qemerald">-$1.2M Risk</span></div>
                          <div className="w-full h-1.5"><div className="bg-qemerald w-[85%] h-full rounded-full" /></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-200">Cloud WAF Update</span><span className="text-qviolet">-$800k Risk</span></div>
                          <div className="w-full h-1.5"><div className="bg-qviolet w-[45%] h-full rounded-full" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 ui-widget rounded-3xl p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-display text-xl font-bold">Candidate Security Controls Portfolio</h3>
                    <span className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-full">Analysis Pool</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs font-mono text-gray-500 uppercase tracking-wider">
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Control</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Cost (₹L)</th>
                          <th className="py-3 px-4 text-right">Risk Reduction (₹L)</th>
                          <th className="py-3 px-4 text-right">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-body text-gray-300">
                        {knapsackData.selected_controls.slice(0, 5).map((c, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-4 px-4 font-mono text-gray-500">{c.id}</td>
                            <td className="py-4 px-4 text-white font-medium">{c.name}</td>
                            <td className="py-4 px-4" style={{ color: CATEGORY_COLORS[c.category] || "#a78bfa" }}>{c.category}</td>
                            <td className="py-4 px-4 text-right font-mono">{c.cost}</td>
                            <td className="py-4 px-4 text-right font-mono text-qemerald font-medium">{c.risk_reduction}</td>
                            <td className="py-4 px-4 text-right font-mono text-qamber font-bold">{c.efficiency ? c.efficiency.toFixed(2) : (c.risk_reduction / c.cost).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== AUTH VIEW (LOGIN / SIGNUP) ==================== */}
        {currentView === "auth" && (
          <section id="view-auth" className="max-w-xl mx-auto px-6 pb-20 relative z-10 w-full flex flex-col justify-center">
            <div className="glass-panel p-10 rounded-2xl relative">
              {authMode === "signup" ? (
                <div>
                  <div className="text-center mb-10">
                    <h2 className="font-display text-3xl font-bold mb-2">Initialize Instance</h2>
                    <p className="text-gray-400 text-sm">Real email required for multi-factor code delivery.</p>
                  </div>
                  <form className="space-y-5" onSubmit={handleSignupSubmit}>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Rohan Sharma"
                          value={signupForm.name}
                          onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                          className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Work Email</label>
                        <input
                          type="email"
                          required
                          placeholder="rohan@company.com"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                        />
                      </div>
                    </div>

                    {/* NEW COMPANY NAME FIELD */}
                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Company Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Financial Technologies"
                        value={signupForm.company}
                        onChange={(e) => setSignupForm({ ...signupForm, company: e.target.value })}
                        className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-3 uppercase">Select Your Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setCurrentRole("cfo")} className={`text-left p-4 rounded-xl border transition ${currentRole === "cfo" ? "border-qviolet/60 bg-qviolet/10 shadow-[0_0_0_1px_rgba(167,139,250,0.3)]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-lg bg-qemerald/12 border border-qemerald/25 flex items-center justify-center"><svg className="w-4 h-4 text-qemerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg></div>
                            <div className={`w-5 h-5 rounded-full border border-white/25 flex items-center justify-center ${currentRole === "cfo" ? "bg-qviolet border-qviolet" : ""}`}>{currentRole === "cfo" && <div className="w-1.5 h-1.5 rounded-full bg-[#09090b]" />}</div>
                          </div>
                          <div className="font-display font-semibold text-white text-sm">CFO</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">Financial risk & portfolio view</div>
                        </button>
                        <button type="button" onClick={() => setCurrentRole("ciso")} className={`text-left p-4 rounded-xl border transition ${currentRole === "ciso" ? "border-qviolet/60 bg-qviolet/10 shadow-[0_0_0_1px_rgba(167,139,250,0.3)]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-lg bg-qviolet/12 border border-qviolet/25 flex items-center justify-center"><svg className="w-4 h-4 text-qviolet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
                            <div className={`w-5 h-5 rounded-full border border-white/25 flex items-center justify-center ${currentRole === "ciso" ? "bg-qviolet border-qviolet" : ""}`}>{currentRole === "ciso" && <div className="w-1.5 h-1.5 rounded-full bg-[#09090b]" />}</div>
                          </div>
                          <div className="font-display font-semibold text-white text-sm">CISO</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">Technical posture & coverage view</div>
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isSendingOtp} className="w-full bg-white text-[#09090b] font-semibold py-3.5 rounded-lg mt-6 hover:bg-gray-200 transition flex items-center justify-center gap-2">
                      {isSendingOtp ? "Dispatching Code to Inbox..." : "Request Provisioning"}
                    </button>
                    <div className="text-center mt-6">
                      <button type="button" onClick={() => setAuthMode("login")} className="text-xs text-gray-500 hover:text-white transition">Already have an instance? <span className="text-qviolet underline">Log in</span></button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-10">
                    <h2 className="font-display text-3xl font-bold mb-2">Authenticate</h2>
                    <p className="text-gray-400 text-sm">Access your active risk quantification instance.</p>
                  </div>
                  <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="rohan@company.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-qviolet transition font-body placeholder:text-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-400 mb-3 uppercase">Sign in as</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setCurrentRole("cfo")} className={`p-3 rounded-xl border text-left transition ${currentRole === "cfo" ? "border-qviolet/60 bg-qviolet/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}>
                          <span className="font-display font-semibold text-white text-sm">CFO</span>
                        </button>
                        <button type="button" onClick={() => setCurrentRole("ciso")} className={`p-3 rounded-xl border text-left transition ${currentRole === "ciso" ? "border-qviolet/60 bg-qviolet/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}>
                          <span className="font-display font-semibold text-white text-sm">CISO</span>
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isSendingOtp} className="w-full bg-white text-[#09090b] font-semibold py-3.5 rounded-lg mt-6 hover:bg-gray-200 transition flex items-center justify-center gap-2">
                      {isSendingOtp ? "Dispatching Code to Inbox..." : "Log In"}
                    </button>
                    <div className="text-center mt-6">
                      <button type="button" onClick={() => setAuthMode("signup")} className="text-xs text-gray-500 hover:text-white transition">Need an instance? <span className="text-qviolet underline">Sign up</span></button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== MFA VIEW ==================== */}
        {currentView === "mfa" && (
          <section id="view-mfa" className="max-w-xl mx-auto px-6 pb-20 relative z-10 w-full flex flex-col justify-center">
            <div className="glass-panel p-10 rounded-2xl relative text-center">
              <div className="w-12 h-12 mx-auto bg-qviolet/10 border border-qviolet/20 text-qviolet rounded-full flex items-center justify-center mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h2 className="font-display text-3xl font-bold mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm mb-8">
                We've sent a 6-digit verification code to <br />
                <span className="text-white font-medium">{activeEmail}</span>.
              </p>
              <form onSubmit={handleMfaSubmit} className="space-y-6">
                <div>
                  <input type="text" maxLength={6} placeholder="000000" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} className="w-full text-center tracking-[1em] text-2xl font-mono bg-[#09090b]/80 border border-white/10 rounded-lg px-4 py-4 focus:outline-none focus:border-qviolet transition" />
                  {mfaError && <p className="text-qrose text-xs mt-3 bg-qrose/10 py-2 rounded border border-qrose/20">{mfaError}</p>}
                </div>
                <button type="submit" className="w-full bg-white text-[#09090b] font-semibold py-3.5 rounded-lg hover:bg-gray-200 transition">Verify & Continue</button>
              </form>
            </div>
          </section>
        )}

        {/* ==================== CFO DASHBOARD ==================== */}
        {currentView === "cfo-dashboard" && (
          <section id="view-cfo-dashboard" className="max-w-[1280px] mx-auto px-6 pb-20 relative z-10 w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-qviolet uppercase tracking-widest mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qviolet animate-pulse" />
                  Financial Risk Portfolio · Executive View
                </div>
                <h1 className="font-display text-4xl font-bold text-white tracking-tight">Good evening{currentUserName}</h1>
                <p className="text-sm text-gray-400 mt-2">
                  Last portfolio recomputation: <span className="text-white font-mono">08 Sept, 06:21 pm</span> · Solver: <span className="text-qemerald font-mono">Optimal</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsAuditModalOpen(true)} className="text-xs font-mono uppercase tracking-wider text-qemerald hover:text-white border border-qemerald/30 hover:border-qemerald/60 bg-qemerald/10 px-3 py-2 rounded-lg transition flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-qemerald animate-pulse" /> AUDIT LOG
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ui-widget rounded-2xl p-5 glow-rose">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Capital at Risk (Pre)</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">₹{CFO_MOCK_DATA.kpis.capitalAtRisk}</span>
                  <span className="text-lg text-gray-500">L</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 font-body">Annualized Loss Expectancy · pre-optimization</div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-emerald">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Risk Neutralized</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">₹{CFO_MOCK_DATA.kpis.riskNeutralized}</span>
                  <span className="text-lg text-gray-500">L</span>
                </div>
                <div className="text-[10px] text-qemerald mt-2 font-mono">↓ {CFO_MOCK_DATA.kpis.exposureReduction} exposure reduction</div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-violet">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Budget Deployed</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">₹{CFO_MOCK_DATA.kpis.budgetDeployed}</span>
                  <span className="text-lg text-gray-500">L <span className="text-gray-600">/ 75L</span></span>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 font-body">100% capacity utilized</div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-amber">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Portfolio ROI</div>
                <div className="text-3xl font-mono font-bold text-qamber tracking-tight mt-1">{CFO_MOCK_DATA.kpis.roi}x</div>
                <div className="text-[10px] text-gray-500 mt-2 font-body">₹ risk reduced per ₹ spent</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="ui-widget rounded-3xl p-6 lg:col-span-2">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-display font-semibold text-white">Loss Exposure Trend</h3>
                    <p className="text-[11px] text-gray-500 mt-1">12-month rolling ALE · portfolio impact from month 10 onward</p>
                  </div>
                  <div className="flex gap-1 text-[10px] font-mono">
                    <span className="px-2 py-1 rounded bg-white/10 text-white cursor-pointer">12M</span>
                    <span className="px-2 py-1 rounded text-gray-500 hover:text-white transition cursor-pointer">6M</span>
                    <span className="px-2 py-1 rounded text-gray-500 hover:text-white transition cursor-pointer">3M</span>
                  </div>
                </div>
                <div className="w-full h-48 relative">
                  <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,20 L 72,24 L 144,30 L 216,30 L 288,30 L 360,30 L 432,30 L 504,30 L 576,30 L 648,30 L 720,40 L 800,150 L 800,200 L 0,200 Z" fill="url(#trendGrad)" />
                    <path d="M 0,20 L 72,24 L 144,30 L 216,30 L 288,30 L 360,30 L 432,30 L 504,30 L 576,30 L 648,30 L 720,40 L 800,150" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="0" cy="20" r="3" fill="#a78bfa" />
                    <circle cx="72" cy="24" r="3" fill="#a78bfa" />
                    <circle cx="144" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="216" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="288" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="360" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="432" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="504" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="576" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="648" cy="30" r="3" fill="#a78bfa" />
                    <circle cx="720" cy="40" r="3" fill="#a78bfa" />
                    <circle cx="800" cy="150" r="5" fill="#fff" className="animate-pulse shadow-[0_0_10px_#fff]" />
                  </svg>
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-mono text-gray-600 uppercase">
                  {CFO_MOCK_DATA.trend.labels.map(l => <span key={l}>{l}</span>)}
                </div>
              </div>

              <div className="ui-widget rounded-3xl p-6 flex flex-col">
                <div>
                  <h3 className="font-display font-semibold text-white">Budget Allocation</h3>
                  <p className="text-[11px] text-gray-500 mt-1">By control category</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
                  <div className="w-40 h-40 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="#a78bfa" strokeWidth="16" fill="none" strokeDasharray="251.2" strokeDashoffset="0" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-white tracking-tight">31</span>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Controls</span>
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center text-xs mt-8 px-2">
                    <div className="flex items-center gap-2 text-gray-300 font-body">
                      <div className="w-2.5 h-2.5 rounded-full bg-qviolet"></div>
                      Remediation
                    </div>
                    <span className="font-mono text-gray-400">₹75L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="ui-widget rounded-3xl p-6">
                <h3 className="font-display font-semibold text-white">Risk Reduction Portfolio</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-6">Selected controls ranked by ₹ neutralized</p>
                <div className="space-y-3.5">
                  {CFO_MOCK_DATA.selectedControls.slice(0, 10).map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] font-mono mb-1.5">
                        <span className="text-gray-300">{c.id} · <span className="text-gray-500">{c.name}</span></span>
                        <span className="text-gray-300">₹{c.reduction}L</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-qviolet rounded-full" style={{ width: `${100 - (i * 3)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ui-widget rounded-3xl p-6 flex flex-col">
                <h3 className="font-display font-semibold text-white">Loss Exceedance Curve</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-6">P(annual loss {'>'} threshold) · post-optimization</p>
                <div className="flex-1 w-full relative min-h-[180px]">
                  <svg viewBox="0 0 500 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="exceedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,20 Q 50,25 100,50 T 250,110 T 400,160 T 500,175 L 500,200 L 0,200 Z" fill="url(#exceedGrad)" />
                    <path d="M 0,20 Q 50,25 100,50 T 250,110 T 400,160 T 500,175" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="500" cy="175" r="4" fill="#fff" className="shadow-[0_0_8px_#f87171]" />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                  <div>
                    <div className="font-mono text-white font-bold text-sm tracking-tight">₹200L</div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">23% chance</div>
                  </div>
                  <div>
                    <div className="font-mono text-white font-bold text-sm tracking-tight">₹300L</div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">9% chance</div>
                  </div>
                  <div>
                    <div className="font-mono text-white font-bold text-sm tracking-tight">₹500L</div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">2% chance</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-widget rounded-3xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display font-semibold text-white">Efficient Frontier · Cost vs Risk Reduction</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Every candidate control · selected controls lie on the frontier</p>
                </div>
                <div className="flex gap-4 text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-qviolet shadow-[0_0_8px_#a78bfa]"></span> Selected</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500"></span> Deferred</span>
                </div>
              </div>
              <div className="w-full h-64 relative border-l border-b border-white/10">
                <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible">
                  {[0, 1, 2, 3].map(i => <line key={`y-${i}`} x1="0" y1={i * 75} x2="1000" y2={i * 75} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                  {[1, 2, 3, 4, 5].map(i => <line key={`x-${i}`} x1={i * 200} y1="0" x2={i * 200} y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                  {CFO_MOCK_DATA.scatterPoints.map((p, i) => (
                    <g key={i} transform={`translate(${p.x * 9.5 + 20}, ${280 - (p.y * 3.2)})`}>
                      <circle r={p.selected ? "6" : "4"} fill={p.selected ? "#a78bfa" : "#6b7280"} opacity={p.selected ? "1" : "0.5"} className={p.selected ? "shadow-[0_0_10px_#a78bfa]" : ""} />
                      {i % 4 === 0 && <text x="10" y="2" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">FINDING-{(i * 13).toString(16)}</text>}
                    </g>
                  ))}
                </svg>
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-mono text-gray-500 uppercase">
                <span>← Lower cost</span>
                <span>Higher risk reduction ↑</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="ui-widget rounded-3xl p-6 glow-amber">
                <div className="flex items-center gap-2 text-[10px] font-mono text-qamber uppercase tracking-widest mb-4">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  Deferred Backlog Opportunity
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Additional ₹ at Risk Uncovered</div>
                    <div className="text-2xl font-mono font-bold text-qamber tracking-tight">₹424 L</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">Investment Required</div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tight">₹214 L</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2.5 text-[11px] font-body">
                  <div className="flex justify-between text-gray-400"><span>Suggested next-cycle budget</span><span className="font-mono text-white">≈ ₹110 L</span></div>
                  <div className="flex justify-between text-gray-400"><span>Full-coverage budget (+15% buffer)</span><span className="font-mono text-white">≈ ₹250 L</span></div>
                  <div className="flex justify-between text-gray-400"><span>Deferred controls count</span><span className="font-mono text-white">16</span></div>
                </div>
              </div>
              <div className="ui-widget rounded-3xl p-6 border-t-0 border-l-0 border-r-0 border-b-2 border-b-qamber/20 bg-[#09090b]">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-qamber/10 border border-qamber/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-qamber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold font-display text-white mb-1.5">Approximation Notice</div>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-body">Future budget values are planning-level estimates only. Actual figures will vary with vendor renewal pricing, INR fluctuation, threat-landscape shifts, and re-runs of the Monte Carlo Risk Engine. Re-run the optimizer whenever your cost data or risk model is refreshed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-widget rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Selected Controls · This Cycle</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Funded and being deployed · ranked by capital efficiency</p>
                </div>
                <span className="text-[10px] font-mono bg-qemerald/10 text-qemerald border border-qemerald/20 px-2.5 py-1 rounded-full">9 funded</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <th className="py-3 px-2 font-medium">ID</th>
                      <th className="py-3 px-2 font-medium">Control</th>
                      <th className="py-3 px-2 font-medium">Category</th>
                      <th className="py-3 px-2 text-right font-medium">Cost (₹L)</th>
                      <th className="py-3 px-2 text-right font-medium">Reduction (₹L)</th>
                      <th className="py-3 px-2 text-right font-medium">₹/₹ Efficiency</th>
                      <th className="py-3 px-2 text-right font-medium">ROI Multiple</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-mono text-gray-300">
                    {CFO_MOCK_DATA.selectedControls.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-4 px-2 text-gray-500">{c.id}</td>
                        <td className="py-4 px-2 text-white font-sans font-medium">{c.name}</td>
                        <td className="py-4 px-2 text-gray-400 font-sans">Remediation</td>
                        <td className="py-4 px-2 text-right">₹{c.cost}L</td>
                        <td className="py-4 px-2 text-right text-qemerald">₹{c.reduction}L</td>
                        <td className="py-4 px-2 text-right text-qamber">{c.efficiency}</td>
                        <td className="py-4 px-2 text-right text-white font-bold">{c.roi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ui-widget rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Deferred Portfolio · Next Cycle Candidates</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Ordered by ROI · fund top items first when budget increases</p>
                </div>
                <span className="text-[10px] font-mono bg-qamber/10 text-qamber border border-qamber/20 px-2.5 py-1 rounded-full">16 pending</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <th className="py-3 px-2 font-medium">Priority</th>
                      <th className="py-3 px-2 font-medium">ID</th>
                      <th className="py-3 px-2 font-medium">Control</th>
                      <th className="py-3 px-2 font-medium">Category</th>
                      <th className="py-3 px-2 text-right font-medium">Est. Cost (₹L)</th>
                      <th className="py-3 px-2 text-right font-medium">Potential (₹L)</th>
                      <th className="py-3 px-2 text-right font-medium">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-mono text-gray-300">
                    {CFO_MOCK_DATA.deferredControls.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-4 px-2 text-qamber font-bold">{c.rank}</td>
                        <td className="py-4 px-2 text-gray-500">{c.id}</td>
                        <td className="py-4 px-2 text-white font-sans font-medium">{c.name}</td>
                        <td className="py-4 px-2 text-gray-400 font-sans">Remediation</td>
                        <td className="py-4 px-2 text-right">₹{c.cost}L</td>
                        <td className="py-4 px-2 text-right text-qemerald">₹{c.reduction}L</td>
                        <td className="py-4 px-2 text-right text-white font-bold">{c.roi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ==================== CISO DASHBOARD ==================== */}
        {currentView === "ciso-dashboard" && (
          <section id="view-ciso-dashboard" className="max-w-[1280px] mx-auto px-6 pb-20 relative z-10 w-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-qemerald uppercase tracking-widest mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qemerald animate-pulse" />
                  Technical Posture · Security Operations
                </div>
                <h1 className="font-display text-4xl font-bold text-white tracking-tight">Good evening{currentUserName}</h1>
                <p className="text-sm text-gray-400 mt-2">
                  Coverage snapshot: <span className="text-white font-mono">08 Sept, 07:06 pm</span> · <span className="text-qemerald font-mono">9 controls deployed</span> · <span className="text-qamber font-mono">16 gaps</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsUploadModalOpen(true)} className="text-xs font-mono uppercase tracking-wider text-qviolet hover:text-white border border-qviolet/30 hover:border-qviolet/60 bg-qviolet/10 px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(167,139,250,0.15)]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  INGEST OCSF
                </button>
                <button onClick={() => setIsAuditModalOpen(true)} className="text-xs font-mono uppercase tracking-wider text-qemerald hover:text-white border border-qemerald/30 hover:border-qemerald/60 bg-qemerald/10 px-3 py-2 rounded-lg transition flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-qemerald animate-pulse" /> AUDIT LOG
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ui-widget rounded-2xl p-5 glow-violet flex items-center gap-4">
                <div className="relative w-[52px] h-[52px] flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path className="text-qviolet" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-display font-bold text-white">78</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Posture Score</div>
                  <div className="text-2xl font-mono font-bold text-white tracking-tight">78<span className="text-sm text-gray-500">/100</span></div>
                  <div className="text-[10px] text-qemerald mt-1 font-mono">↑ +4 this month</div>
                </div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-emerald">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Controls Deployed</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">31</span>
                  <span className="text-lg text-gray-500">/25</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-2 font-mono">/400</div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-violet">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Portfolio Coverage</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tight mt-1">8%</div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-qviolet rounded-full" style={{ width: `8%` }} />
                </div>
              </div>
              <div className="ui-widget rounded-2xl p-5 glow-amber">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">Critical Gaps</div>
                <div className="text-3xl font-mono font-bold text-qamber tracking-tight mt-1">369</div>
                <div className="text-[10px] text-gray-500 mt-2 font-body">Deferred · awaiting funding</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="ui-widget rounded-3xl p-6 lg:col-span-2">
                <h3 className="font-display font-semibold text-white">Coverage Heatmap by Category</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-6">Each tile is a control · <span className="text-qemerald">green = deployed</span> · <span className="text-qamber">amber = deferred</span></p>
                <div className="grid grid-cols-12 gap-1.5">
                  {CISO_MOCK_DATA.heatmap.map((tile, i) => (
                    <div key={i} className={`h-8 rounded flex items-center justify-center text-[8px] font-mono ${tile.status === 'deployed' ? 'bg-qemerald/80 text-black font-bold' : tile.status === 'deferred' ? 'bg-qamber/70 text-black font-bold' : 'bg-white/5 text-gray-600'}`}>
                      {tile.id}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ui-widget rounded-3xl p-6 flex flex-col">
                <div>
                  <h3 className="font-display font-semibold text-white">Deployment Status</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Control portfolio breakdown</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center relative mt-6">
                  <div className="w-40 h-40 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="16" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 0.0625)} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="16" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 0.0225)} strokeLinecap="butt" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-white tracking-tight">400</span>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Total</span>
                    </div>
                  </div>
                  <div className="w-full mt-10 space-y-2.5 text-xs px-4">
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-qemerald" /> Deployed</span><span className="font-mono text-white">9</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-qamber" /> Deferred</span><span className="font-mono text-white">16</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-gray-600" /> Not evaluated</span><span className="font-mono text-white">0</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="ui-widget rounded-3xl p-6">
                <h3 className="font-display font-semibold text-white">Deferred Priority Queue</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-6">Rank top-10 gaps by control efficiency</p>
                <div className="space-y-4">
                  {CISO_MOCK_DATA.deferredControls.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] font-mono mb-1.5"><span className="text-gray-300">{c.rank} · <span className="text-gray-500">{c.id}</span></span><span className="text-gray-300">{c.efficiency}</span></div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-qviolet rounded-full" style={{ width: `${100 - (i * 4)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ui-widget rounded-3xl p-6">
                <h3 className="font-display font-semibold text-white">Attack Surface by Category</h3>
                <p className="text-[11px] text-gray-500 mt-1 mb-6">Control counts per category · deployment split</p>
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1.5"><span className="text-gray-300">Remediation (31/400)</span><span className="text-gray-300">400</span></div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-qviolet rounded-full w-full" /></div>
                </div>
              </div>
            </div>

            <div className="ui-widget rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Deployed Controls · Active Coverage</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Confirmed operational · continuously monitored</p>
                </div>
                <span className="text-[10px] font-mono bg-qemerald/10 text-qemerald border border-qemerald/20 px-2.5 py-1 rounded-full">Live</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <th className="py-3 px-2 font-medium">Status</th>
                      <th className="py-3 px-2 font-medium">ID</th>
                      <th className="py-3 px-2 font-medium">Control</th>
                      <th className="py-3 px-2 font-medium">Category</th>
                      <th className="py-3 px-2 text-right font-medium">Efficiency</th>
                      <th className="py-3 px-2 text-right font-medium">Coverage Weight</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-mono text-gray-300">
                    {CISO_MOCK_DATA.deployedControls.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-4 px-2"><span className="flex items-center gap-1.5 text-[9px] text-qemerald font-bold tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-qemerald animate-pulse" /> {c.status}</span></td>
                        <td className="py-4 px-2 text-gray-500">{c.id}</td>
                        <td className="py-4 px-2 text-white font-sans font-medium">{c.name}</td>
                        <td className="py-4 px-2 text-qviolet font-sans">{c.category}</td>
                        <td className="py-4 px-2 text-right text-qamber">{c.efficiency}</td>
                        <td className="py-4 px-2 text-right"><div className="flex items-center justify-end gap-2 text-gray-400"><div className="w-12 h-1 bg-white/10 rounded-full"><div className="h-full bg-gray-500 rounded-full" style={{ width: `${c.weight}%` }} /></div>{c.weight}%</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ui-widget rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Coverage Gaps · Deferred Controls</h3>
                  <p className="text-[11px] text-gray-500 mt-1">Rank-ordered technical remediation queue</p>
                </div>
                <span className="text-[10px] font-mono bg-qamber/10 text-qamber border border-qamber/20 px-2.5 py-1 rounded-full">16 gaps</span>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <th className="py-3 px-2 font-medium">Rank</th>
                      <th className="py-3 px-2 font-medium">ID</th>
                      <th className="py-3 px-2 font-medium">Control</th>
                      <th className="py-3 px-2 font-medium">Category</th>
                      <th className="py-3 px-2 text-right font-medium">Efficiency</th>
                      <th className="py-3 px-2 text-right font-medium">Priority Weight</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-mono text-gray-300">
                    {CISO_MOCK_DATA.deferredControls.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-4 px-2 text-qamber font-bold">{c.rank}</td>
                        <td className="py-4 px-2 text-gray-500">{c.id}</td>
                        <td className="py-4 px-2 text-white font-sans font-medium">{c.name}</td>
                        <td className="py-4 px-2 text-qviolet font-sans">{c.category}</td>
                        <td className="py-4 px-2 text-right text-gray-400">{c.efficiency}</td>
                        <td className="py-4 px-2 text-right"><div className="flex items-center justify-end gap-2 text-gray-400"><div className="w-12 h-1 bg-white/10 rounded-full"><div className="h-full bg-qamber rounded-full" style={{ width: `${c.weight}%` }} /></div>{c.weight}%</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ==================== OCSF INGESTION MODAL ==================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="ui-widget w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl bg-[#09090b]/95 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg sm:text-xl flex items-center gap-2">
                  <svg className="w-5 h-5 text-qviolet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Ingest OCSF Telemetry
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">Upload JSON arrays mapping to the Open Cybersecurity Schema Framework.</p>
              </div>
              <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setFileName(""); }} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${fileName
                    ? "border-qemerald/50 bg-qemerald/5"
                    : "border-white/10 hover:border-qviolet/50 bg-white/[0.02] hover:bg-qviolet/5"
                  }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition ${fileName ? "bg-qemerald/20 text-qemerald" : "bg-white/5 text-gray-400"
                  }`}>
                  {fileName ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {fileName ? (
                  <>
                    <div className="text-sm font-semibold text-white mb-1">{fileName}</div>
                    <div className="text-[11px] text-qemerald font-mono">Ready to process · Click to choose a different file</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-white mb-1">Click to select an OCSF JSON file</div>
                    <div className="text-[11px] text-gray-500 font-mono">Strict format: .json files only (up to 50MB)</div>
                  </>
                )}

                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setFileName(""); }}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={processOcsfData}
                disabled={isUploading || !fileName}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${isUploading || !fileName
                    ? "bg-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-qviolet text-[#09090b] hover:bg-qviolet/90 shadow-[0_0_15px_rgba(167,139,250,0.4)]"
                  }`}
              >
                {isUploading ? (
                  <><div className="w-3 h-3 border-2 border-[#09090b] border-t-transparent rounded-full animate-spin" /> Processing...</>
                ) : "Process Telemetry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOG MODAL ==================== */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="ui-widget w-full max-w-4xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl bg-[#09090b]/95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-qemerald animate-pulse" />
                <h3 className="font-display font-bold text-white text-lg sm:text-xl">Solver Execution & Remediation Log</h3>
                <span className="text-[10px] font-mono bg-qemerald/10 text-qemerald border border-qemerald/20 px-2 py-0.5 rounded-full">
                  {CFO_MOCK_DATA.selectedControls.length} Selected Controls
                </span>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
              <div><span className="text-gray-500 block uppercase">Solver Status</span><span className="text-qemerald font-bold">Optimal</span></div>
              <div><span className="text-gray-500 block uppercase">Latency</span><span className="text-white">0.0247s</span></div>
              <div><span className="text-gray-500 block uppercase">CapEx Spent</span><span className="text-qamber">₹75L / 75L</span></div>
              <div><span className="text-gray-500 block uppercase">Neutralized</span><span className="text-qviolet">₹251L</span></div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4 font-mono text-xs">
              {CFO_MOCK_DATA.selectedControls.map((control, index) => {
                const now = new Date();
                const baseTime = now.getTime() - (8 - index) * 450;
                return (
                  <div key={index} className="p-4 rounded-lg bg-[#050508] border border-white/10 text-gray-400 space-y-1 text-[11.5px]">
                    <div className="border-b border-white/10 pb-1 mb-2 text-gray-200 font-bold">FINDING ID: {control.id}</div>
                    <div><span className="text-gray-500">({new Date(baseTime).toISOString()})</span> <span className="text-gray-200">DATA_INGESTION</span> : data_ingestion/telemetry_parser.py -&gt; Parsed constraint. CapEx: ₹{control.cost}L.</div>
                    <div><span className="text-gray-500">({new Date(baseTime + 112).toISOString()})</span> <span className="text-gray-200">RISK_QUANTIFICATION</span> : risk_engine/monte_carlo.py -&gt; Monte Carlo simulated. Neutralized ALE: ₹{control.reduction}L.</div>
                    <div><span className="text-gray-500">({new Date(baseTime + 345).toISOString()})</span> <span className="text-gray-200">ILP_OPTIMIZATION</span> : solver/solver.py -&gt; Assignment: SELECTED [x_{index}=1].</div>
                    <div><span className="text-gray-500">({new Date(baseTime + 410).toISOString()})</span> <span className="text-gray-200">ORCHESTRATION</span> : pipeline/dispatcher.py -&gt; Appended to active remediation queue.</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button onClick={() => setIsAuditModalOpen(false)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs transition">Close Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#09090b] relative z-10 mt-auto py-8 px-6 text-xs text-gray-500 text-center">
        &copy; 2026 QuantifySec. All rights reserved. Deterministic Risk Pipeline.
      </footer>
    </div>
  );
}