import { useState } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle2, Plus } from 'lucide-react';
import { KpiCard, Badge, Spinner } from './ui.jsx';
import { money, money2 } from '../utils/format.js';

const MATCH = { exact: ['green', 'Exact'], normalized: ['blue', 'Normalized'], fuzzy: ['amber', 'Approx. match'] };
const num = (v) => (v === undefined || v === null ? '—' : money2(v));

export function InsightsCard({ insights }) {
  if (!insights) return null;
  const live = insights.source === 'llm';
  const Section = ({ icon: Icon, title, items, tone }) => items?.length > 0 && (
    <div>
      <h3 className={`mb-2 flex items-center gap-2 text-sm font-semibold ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" />{title}</h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
  return (
    <section className="card p-5" aria-label="AI Market Insights">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-brand-500" aria-hidden="true" />AI Market Insights</h2>
        <Badge tone={live ? 'indigo' : 'gray'}>{live ? `AI-generated · ${insights.model}` : 'Template analysis (no LLM)'}</Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{insights.summary}</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <Section icon={Lightbulb} title="Key insights" items={insights.keyInsights} tone="text-slate-900" />
        <Section icon={CheckCircle2} title="Opportunities" items={insights.opportunities} tone="text-emerald-700" />
        <Section icon={AlertTriangle} title="Risks & uncertainty" items={insights.risks} tone="text-amber-700" />
        <div><h3 className="mb-2 text-sm font-semibold text-slate-900">Recommendation</h3><p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{insights.recommendation}</p></div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {insights.note ? `${insights.note} ` : ''}All figures are computed by the backend from the demo comparable-transaction dataset; the AI only explains them.
      </p>
    </section>
  );
}

export default function FmvResult({ analysis, onAddMarketData, onRerun, rerunning }) {
  const { summary: s, items, warnings } = analysis;
  const [showWarnings, setShowWarnings] = useState(false);
  const unmatched = items.filter((i) => i.status !== 'valued');
  const valued = items.filter((i) => i.status === 'valued');
  const resale = s.estimatedResaleValue ?? s.estimatedMarketValue;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Assets Analyzed" value={s.totalQuantity?.toLocaleString()} hint={`${s.itemsAnalyzed} line items${s.unmatchedCount ? ` · ${s.unmatchedCount} without data` : ''}`} />
        <KpiCard label="Total Recovery Value" value={money(s.estimatedMarketValue)} hint="Estimated FMV × quantity" />
        <KpiCard label="Recommended Buy Price" value={money(s.recommendedBuyValue)} hint={`${Math.round(s.buyRatio * 100)}% of FMV`} />
        <KpiCard label="Estimated Resale Value" value={money(resale)} hint={`${Math.round((s.resaleRatio ?? 1) * 100)}% of FMV expected`} />
        <KpiCard label="Estimated Margin" value={money(s.estimatedPotentialMargin)} hint={s.marginPct !== undefined ? `${s.marginPct}% of resale value` : 'Resale − buy price'} />
      </div>

      {warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {warnings.length} row(s) were skipped. <button className="font-medium underline" onClick={() => setShowWarnings((v) => !v)}>{showWarnings ? 'Hide' : 'Show'} details</button>
          {showWarnings && <ul className="mt-2 list-disc pl-5">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Asset valuation detail</h2>
          <Badge tone="gray">Demo comparable-transaction dataset · historical, not live prices</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>
              {['Uploaded asset → matched model', 'Category', 'Grade', 'Qty', 'Comparables', 'FMV / Unit', 'Recovery Value', 'Buy Price', 'Resale Value', 'Margin'].map((h, i) => <th key={h} className={`th ${i >= 3 ? 'text-right' : ''}`}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => {
                const ok = it.status === 'valued';
                const [tone, label] = MATCH[it.matchType] || [];
                const st = it.priceStats;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="td min-w-[16rem]">
                      <p className="font-medium text-slate-900">{it.model}</p>
                      {ok && (<p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {it.matchedModel !== it.model && <span>→ {it.matchedModel}</span>}{label && <Badge tone={tone}>{label}</Badge>}</p>)}
                      {!ok && <div className="mt-1 flex flex-wrap items-center gap-2"><Badge tone="amber">No comparable data found</Badge>
                        <button className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline" onClick={() => onAddMarketData(it.model)}><Plus className="h-3 w-3" />Add market data</button></div>}
                    </td>
                    <td className="td">{it.category || '—'}</td>
                    <td className="td">{it.condition}{it.conditionAssumed && <span className="ml-1 text-xs text-slate-400" title="Condition missing or unrecognised; assumed Good">(assumed)</span>}</td>
                    <td className="td text-right">{it.quantity}</td>
                    <td className="td whitespace-nowrap text-right text-xs">{ok && st ? <><span className="font-medium text-slate-900">{st.sampleCount}</span> · {money(st.min)}–{money(st.max)}</> : '—'}</td>
                    <td className="td text-right">{ok ? money2(it.fmvPerUnit) : 'N/A'}</td>
                    <td className="td text-right font-medium text-slate-900">{ok ? money2(it.totalFMV) : 'N/A'}</td>
                    <td className="td text-right">{ok ? money2(it.recommendedBuy) : 'N/A'}</td>
                    <td className="td text-right">{ok ? num(it.estimatedResale) : 'N/A'}</td>
                    <td className="td text-right text-emerald-700">{ok ? money2(it.potentialMargin) : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
            {valued.length > 0 && (
              <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900"><tr>
                <td className="td" colSpan={3}>Total (valued lines)</td><td className="td text-right">{valued.reduce((n, i) => n + i.quantity, 0)}</td><td className="td" /><td className="td" />
                <td className="td text-right">{money2(s.estimatedMarketValue)}</td><td className="td text-right">{money2(s.recommendedBuyValue)}</td>
                <td className="td text-right">{num(s.estimatedResaleValue)}</td><td className="td text-right text-emerald-700">{money2(s.estimatedPotentialMargin)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          FMV/unit = median of comparable transactions × condition grade factor. Buy price and resale value are set as a share of FMV (see Settings). Lines without comparable data are excluded from totals.
        </p>
        {unmatched.length > 0 && onRerun && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
            <span>Added market data for a missing model? Re-run to include it.</span>
            <button className="btn-secondary" onClick={onRerun} disabled={rerunning}>{rerunning && <Spinner />}Re-run analysis</button>
          </div>
        )}
      </div>

      {/* <InsightsCard insights={analysis.aiInsights} /> */}
    </div>
  );
}
