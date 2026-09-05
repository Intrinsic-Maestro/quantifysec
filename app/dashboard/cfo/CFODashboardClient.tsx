'use client';
import { useEffect, useRef } from 'react';
import { DashboardData, CATEGORY_COLORS } from '../sharedData';

export default function CFODashboardClient({ data }: { data: DashboardData }) {
  const trendChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trendChartRef.current) return;
    const maxVal = Math.max(...data.financial.risk_trend_values);
    const svg = `<svg viewBox="0 0 400 200" width="100%" height="100%">
      ${data.financial.risk_trend_values.map((v, i, arr) => {
        if (i === 0) return '';
        const x1 = ((i-1) / (arr.length-1)) * 360 + 20;
        const y1 = 180 - (arr[i-1] / maxVal) * 160;
        const x2 = (i / (arr.length-1)) * 360 + 20;
        const y2 = 180 - (v / maxVal) * 160;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#00ffcc" stroke-width="3" />`;
      }).join('')}
      ${data.financial.risk_trend_values.map((v, i, arr) => {
        const x = (i / (arr.length-1)) * 360 + 20;
        const y = 180 - (v / maxVal) * 160;
        return `<circle cx="${x}" cy="${y}" r="4" fill="#111" stroke="#00ffcc" stroke-width="2" />`;
      }).join('')}
    </svg>`;
    trendChartRef.current.innerHTML = svg;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">CAPITAL AT RISK (PRE)</div>
          <div className="text-3xl kpi-number">${data.financial.capital_at_risk_before}M</div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">CAPITAL AT RISK (POST)</div>
          <div className="text-3xl kpi-number highlight">${data.financial.capital_at_risk_after}M</div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">RISK NEUTRALIZED</div>
          <div className="text-3xl kpi-number text-[#00ffcc]">${data.total_risk_reduction}M</div>
        </div>
        <div className="ui-widget p-5">
          <div className="text-slate-400 font-mono text-xs mb-1">PORTFOLIO ROI</div>
          <div className="text-3xl kpi-number">{data.financial.portfolio_roi}x</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ui-widget p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            Loss Exposure Trend
          </h3>
          <div className="h-64" ref={trendChartRef}></div>
        </div>
        <div className="ui-widget p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            Selected Controls Overview
          </h3>
          <div className="overflow-auto custom-scrollbar h-64">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a] text-slate-400 font-mono text-xs">
                <tr>
                  <th className="pb-3 pt-2">CONTROL</th>
                  <th className="pb-3 pt-2">CATEGORY</th>
                  <th className="pb-3 pt-2 text-right">COST</th>
                  <th className="pb-3 pt-2 text-right">IMPACT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {data.selected_controls.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-slate-200">{c.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10" style={{color: CATEGORY_COLORS[c.category] || '#fff'}}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 text-right">${c.cost}M</td>
                    <td className="py-3 text-right text-[#00ffcc]">-${c.risk_reduction}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="ui-widget p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-red-400">
            Deferred Controls Backlog
          </h3>
          <div className="overflow-auto custom-scrollbar h-64">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0a0a0a] text-slate-400 font-mono text-xs">
                <tr>
                  <th className="pb-3 pt-2">RANK</th>
                  <th className="pb-3 pt-2">CONTROL</th>
                  <th className="pb-3 pt-2 text-right">COST</th>
                  <th className="pb-3 pt-2 text-right">MISSED IMPACT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {data.deferred_controls.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors text-slate-400">
                    <td className="py-3">#{c.priority_rank}</td>
                    <td className="py-3">{c.name}</td>
                    <td className="py-3 text-right">${c.cost}M</td>
                    <td className="py-3 text-right text-red-400">-${c.risk_reduction}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="ui-widget p-6 bg-gradient-to-br from-red-900/20 to-black border-red-900/30">
          <h3 className="font-display font-semibold mb-4">Risk Exposure Approximation Notice</h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            The optimization solver identified {data.future_budget.deferred_count} viable controls that were deferred due to budget constraints (${data.budget}M limit). 
          </p>
          <div className="p-4 rounded-lg bg-black/50 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-slate-500">RESIDUAL RISK DEFERRED</span>
              <span className="text-lg font-mono font-bold text-red-400">${data.future_budget.total_deferred_reduction}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500">REQUIRED BUDGET ADDITION</span>
              <span className="text-lg font-mono font-bold text-slate-200">${data.future_budget.total_deferred_cost}M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
