'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCFO = pathname.includes('/cfo');
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen hero-bg flex flex-col font-sans relative z-10">
      <nav className="glass-panel mx-4 mt-4 mb-6 px-6 py-4 flex justify-between items-center z-50 sticky top-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00ffcc] to-blue-600 flex items-center justify-center font-display font-bold text-black shadow-[0_0_10px_rgba(0,255,204,0.5)]">
            Q
          </div>
          <span className="font-display font-bold text-xl tracking-tight">quantify<span className="text-[#00ffcc]">sec</span></span>
          <span className="mx-3 text-white/20">|</span>
          <span className="font-mono text-sm text-slate-300">
            VIEW: <span className="text-[#00ffcc] font-bold">{isCFO ? 'CFO (FINANCIAL)' : 'CISO (TECHNICAL)'}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href={isCFO ? '/dashboard/ciso' : '/dashboard/cfo'}
            className="px-4 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-mono text-sm text-white flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></svg>
            Switch to {isCFO ? 'CISO' : 'CFO'}
          </Link>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-mono text-sm flex items-center gap-2"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 px-4 pb-12 max-w-[1600px] mx-auto w-full">
        {children}
      </main>

      <footer className="py-6 text-center border-t border-white/5 mt-auto">
        <p className="font-mono text-xs text-slate-500">
          quantifysec © {new Date().getFullYear()} | CONFIDENTIAL
        </p>
      </footer>
    </div>
  );
}
