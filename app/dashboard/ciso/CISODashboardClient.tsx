'use client';
import { DashboardData, CATEGORY_COLORS } from '../sharedData';

export default function CISODashboardClient({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ui-widget p-5 flex flex-col justify-between">
          <div className="text-slate-400 font-mono text-xs mb-2">POSTURE SCORE</div>
          <div className="flex items-end gap-3">
            <div className="text-4xl kpi-number text-[#00ffcc]">
              {Math.round((data.financial.capital_at_risk_before - data.financial.capital_at_risk_after) / data.financial.capital_at_risk_before * 100)}%
            </div>
          </div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">CONTROLS DEPLOYED</div>
          <div className="text-3xl kpi-number">{data.selected_controls.length}</div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">CRITICAL GAPS</div>
          <div className="text-3xl kpi-number text-red-400">{data.deferred_controls.slice(0,5).length}</div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">SOLVER STATUS</div>
          <div className="text-xl font-mono text-[#00ffcc] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse"></span>
            {data.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ui-widget p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            Deployed Controls List
          </h3>
          <div className="overflow-auto custom-scrollbar h-80">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a] text-slate-400 font-mono text-xs z-10">
                <tr>
                  <th className="pb-3 pt-2">ID</th>
                  <th className="pb-3 pt-2">CONTROL NAME</th>
                  <th className="pb-3 pt-2">CATEGORY</th>
                  <th className="pb-3 pt-2 text-right">EFFICIENCY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {data.selected_controls.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-slate-500">{c.id}</td>
                    <td className="py-3 text-slate-200">{c.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10" style={{color: CATEGORY_COLORS[c.category] || '#fff'}}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[#00ffcc]">{c.efficiency.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="ui-widget p-6 border-red-900/30">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-red-400">
            Critical Coverage Gaps (Deferred)
          </h3>
          <div className="overflow-auto custom-scrollbar h-80">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a] text-slate-400 font-mono text-xs z-10">
                <tr>
                  <th className="pb-3 pt-2">ID</th>
                  <th className="pb-3 pt-2">CONTROL NAME</th>
                  <th className="pb-3 pt-2">CATEGORY</th>
                  <th className="pb-3 pt-2 text-right">RISK EXP.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {data.deferred_controls.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors text-slate-400">
                    <td className="py-3 text-slate-600">{c.id}</td>
                    <td className="py-3">{c.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10" style={{color: CATEGORY_COLORS[c.category] || '#fff'}}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 text-right text-red-400">{c.risk_reduction}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
