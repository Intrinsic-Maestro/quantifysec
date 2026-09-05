import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00ffcc] selection:text-black font-sans relative overflow-x-hidden hero-bg">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-x-0 rounded-none bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00ffcc] to-blue-600 flex items-center justify-center font-display font-bold text-black">Q</div>
            <span className="font-display font-bold text-xl tracking-tight">quantify<span className="text-[#00ffcc]">sec</span></span>
          </div>
          <div className="flex items-center gap-6 font-mono text-sm">
            <Link href="/login" className="px-5 py-2.5 rounded-md border border-[#00ffcc]/30 text-[#00ffcc] hover:bg-[#00ffcc]/10 hover:shadow-[0_0_15px_rgba(0,255,204,0.3)] transition-all">
              SYSTEM LOGIN_
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="max-w-4xl pt-16 pb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-[#00ffcc] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse"></span>
            OPTIMIZATION SOLVER ACTIVE
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
            Stop guessing.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-blue-500">
              Start quantifying.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed mb-12">
            The first cyber risk platform that translates technical vulnerabilities into financial exposure, bridging the gap between CISO realities and CFO priorities.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="px-8 py-4 bg-[#00ffcc] text-black font-semibold rounded-lg hover:bg-white transition-colors flex items-center gap-2 font-display">
              Access Dashboard
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
