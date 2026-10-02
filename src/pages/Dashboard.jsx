import { Link } from 'react-router-dom';
import { Users, Briefcase, TrendingUp, Trophy, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboard } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { KpiCard, PageHeader, StatusBadge, StageBadge, Owner, Skeleton, TableSkeleton, EmptyState } from '../components/ui.jsx';
import { money, dateShort, ownerOf } from '../utils/format.js';
import { stageLabel } from '../utils/constants.js';

export default function Dashboard() {
  const { data, loading } = useFetch(getDashboard);
  const k = data?.kpis;
  return (
    <>
      <PageHeader title="Dashboard" description="Live overview of client leads, deals pipeline, valuations and team performance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={loading} label="Client Leads" value={k?.totalLeads?.toLocaleString()} icon={Users} />
        <KpiCard loading={loading} label="Active Opportunities" value={k?.activeDeals} icon={Briefcase} hint="Inquiry → Negotiation" />
        <KpiCard loading={loading} label="Pipeline Value" value={money(k?.pipelineValue)} icon={TrendingUp} />
        <KpiCard loading={loading} label="Won Deal Value" value={money(k?.wonRevenue)} icon={Trophy} />
      </div>

      <section className="card mt-6 p-5" aria-label="Asset valuation activity">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Calculator className="h-4 w-4 text-brand-500" aria-hidden="true" />Asset valuation activity</h2>
          <Link to="/fmv" className="text-xs font-medium text-brand-600 hover:underline">Open Asset Valuation</Link>
        </div>
        {loading ? <Skeleton className="mt-4 h-12" /> : (
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[['Valuations run', data.valuation.analyses], ['Assets valued', data.valuation.assets?.toLocaleString()], ['Total recovery value', money(data.valuation.recoveryValue)],
            ['Recommended buy price', money(data.valuation.buyValue)], ['Estimated margin', money(data.valuation.margin)]].map(([k2, v]) => (
              <div key={k2}><dt className="text-xs text-slate-500">{k2}</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{v}</dd></div>
            ))}
          </dl>
        )}
        <p className="mt-3 text-xs text-slate-400">Based on saved valuations using the demo comparable-transaction dataset.</p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">Deals pipeline summary</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {loading ? Array.from({ length: 6 }, (_, i) => <li key={i} className="py-3"><Skeleton className="h-5" /></li>) :
              data.pipeline.map((s) => (
                <li key={s.stage} className="flex items-center justify-between py-2.5 text-sm">
                  <StageBadge value={s.stage} />
                  <span className="text-slate-500">{s.count} deals</span>
                  <span className="font-medium text-slate-900">{money(s.value)}</span>
                </li>
              ))}
          </ul>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Pipeline value by stage</h2>
          <div className="mt-4 h-64">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pipeline.map((p) => ({ ...p, label: stageLabel(p.stage) }))} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} width={48} />
                  <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" name="Value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-semibold text-slate-900">Sales performance</h2></div>
        {loading ? <TableSkeleton cols={6} /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>
                {['Salesperson', 'Leads', 'Active deals', 'Won deals', 'Pipeline value', 'Won revenue'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.salesPerformance.map((p) => (
                  <tr key={p.salespersonId} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900"><Owner person={p} /></td>
                    <td className="td">{p.leads}</td><td className="td">{p.activeDeals}</td><td className="td">{p.wonDeals}</td>
                    <td className="td">{money(p.pipelineValue)}</td><td className="td font-medium">{money(p.wonRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <RecentList title="Recent client leads" to="/leads" loading={loading} items={data?.recentLeads}
          render={(l) => (<><div><p className="font-medium text-slate-900">{l.name}</p><p className="text-xs text-slate-500">{l.company} · {dateShort(l.createdAt)}</p></div><StatusBadge value={l.status} /></>)} />
        <RecentList title="Recent opportunities" to="/deals" loading={loading} items={data?.recentDeals}
          render={(d) => (<><div><p className="font-medium text-slate-900">{d.title}</p><p className="text-xs text-slate-500">{ownerOf(d)?.name || 'Unassigned'} · {money(d.value)}</p></div><StageBadge value={d.stage} /></>)} />
      </section>
    </>
  );
}

function RecentList({ title, to, items, loading, render }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <Link to={to} className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
      </div>
      {loading ? <TableSkeleton rows={4} cols={2} /> : !items?.length ? <EmptyState title="Nothing here yet" /> : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => <li key={it._id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">{render(it)}</li>)}
        </ul>
      )}
    </div>
  );
}
