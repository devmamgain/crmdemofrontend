import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { getSalespersonReport, getSalespeople } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, KpiCard, Skeleton, Avatar } from '../components/ui.jsx';
import { money, monthLabel } from '../utils/format.js';
import { CHART_COLORS, stageLabel } from '../utils/constants.js';

function ChartCard({ title, loading, children }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 h-64">{loading ? <Skeleton className="h-full w-full" /> : children}</div>
    </div>
  );
}

export default function Reports() {
  const [owner, setOwner] = useState('');
  const { data: people } = useFetch(getSalespeople);
  const { data, loading } = useFetch(() => getSalespersonReport(owner), [owner]);
  const m = data?.metrics;
  const axis = { tickLine: false, axisLine: false, fontSize: 12 };
  const who = people?.find((p) => p._id === owner);

  return (
    <>
      <PageHeader title="Sales Reports" description="Salesperson and team performance, calculated live from leads and recovery opportunities."
        actions={<select className="input !w-52" aria-label="Select salesperson" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Whole team</option>{people?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>} />

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        {who ? <><Avatar name={who.name} size="md" /><span className="font-medium text-slate-900">{who.name}</span><span>· {who.role} · {who.team}</span></> : <span>Showing totals for the whole team</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={loading} label="Client Leads" value={m?.totalLeads} />
        <KpiCard loading={loading} label="Active Opportunities" value={m?.activeDeals} />
        <KpiCard loading={loading} label="Won Deals" value={m?.wonDeals} />
        <KpiCard loading={loading} label="Lost Deals" value={m?.lostDeals} />
        <KpiCard loading={loading} label="Pipeline Value" value={money(m?.pipelineValue)} />
        <KpiCard loading={loading} label="Won Deal Value" value={money(m?.wonRevenue)} />
        <KpiCard loading={loading} label="Average Deal Value" value={money(m?.averageDealValue)} hint="Won revenue ÷ won deals" />
        <KpiCard loading={loading} label="Conversion Rate" value={`${m?.conversionRate ?? 0}%`} hint="Won ÷ (won + lost) deals" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Opportunities by stage" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.dealsByStage?.map((s) => ({ ...s, label: stageLabel(s.stage) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" {...axis} fontSize={11} /><YAxis allowDecimals={false} {...axis} width={32} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v, n, p) => [`${v} deals (${money(p.payload.value)})`, 'Deals']} />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Won revenue over time (last 6 months)" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueOverTime?.map((r) => ({ ...r, label: monthLabel(r.month) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" {...axis} /><YAxis {...axis} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => money(v)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Leads by status" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.leadsByStatus?.filter((s) => s.count > 0)} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data?.leadsByStatus?.filter((s) => s.count > 0).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
