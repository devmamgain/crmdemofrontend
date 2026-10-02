import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLeads, deleteLead, getSalespeople } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, StatusBadge, Owner, TableSkeleton, EmptyState } from '../components/ui.jsx';
import LeadFormModal from '../components/LeadFormModal.jsx';
import { LEAD_STATUSES } from '../utils/constants.js';
import { money, dateShort, ownerOf } from '../utils/format.js';

const SORTS = [['-createdAt', 'Newest'], ['createdAt', 'Oldest'], ['-estimatedValue', 'Value: high → low'], ['estimatedValue', 'Value: low → high'], ['name', 'Name A–Z']];

export default function Leads() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);

  const { data: people } = useFetch(getSalespeople);
  const params = useMemo(() => ({ q: dq || undefined, status: status || undefined, salespersonId: owner || undefined, sort }), [dq, status, owner, sort]);
  const { data, loading, reload } = useFetch(() => getLeads(params), [params]);
  const leads = data?.data || [];
  const filtered = Boolean(dq || status || owner);

  async function remove(lead) {
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    try { await deleteLead(lead._id); toast.success('Lead deleted'); setDetail(null); reload({ silent: true }); } catch (e) { toast.error(e.message); }
  }
  const openForm = (lead = null) => { setEditing(lead); setFormOpen(true); };

  return (
    <>
      <PageHeader title="Client Leads" description="Track and qualify organizations with IT assets to recover, remarket or securely retire."
        actions={<button className="btn-primary" onClick={() => openForm()}><Plus className="h-4 w-4" />New lead</button>} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className="input pl-9" placeholder="Search contact, client, email" aria-label="Search leads" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" aria-label="Filter by owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">All owners</option><option value="unassigned">Unassigned</option>
          {people?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select className="input" aria-label="Sort leads" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <TableSkeleton rows={8} cols={6} /> : !leads.length ? (
          <EmptyState icon={Users} title={filtered ? 'No leads match your filters' : 'No leads yet'}
            description={filtered ? 'Try clearing a filter or search term.' : 'Create your first client lead or generate suggestions with AI Prospecting.'}
            action={!filtered && <button className="btn-primary" onClick={() => openForm()}><Plus className="h-4 w-4" />New lead</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr>
                {['Contact', 'Client', 'Industry', 'Status', 'Owner', 'Est. assets', 'Est. value', 'Created', ''].map((h, i) => <th key={i} className="th">{h || <span className="sr-only">Actions</span>}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(l)}>
                    <td className="td font-medium text-slate-900">{l.name}</td>
                    <td className="td">{l.company}</td>
                    <td className="td">{l.industry || '—'}</td>
                    <td className="td"><StatusBadge value={l.status} /></td>
                    <td className="td"><Owner person={ownerOf(l)} /></td>
                    <td className="td">{l.assetVolume ? l.assetVolume.toLocaleString() : '—'}</td>
                    <td className="td">{money(l.estimatedValue)}</td>
                    <td className="td whitespace-nowrap">{dateShort(l.createdAt)}</td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost !h-8 !px-2" aria-label={`Edit ${l.name}`} onClick={() => openForm(l)}><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost !h-8 !px-2 text-red-600" aria-label={`Delete ${l.name}`} onClick={() => remove(l)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && leads.length > 0 && <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">{leads.length} lead{leads.length === 1 ? '' : 's'}</p>}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" role="dialog" aria-label="Lead details">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-semibold">{detail.name}</h2><p className="text-sm text-slate-500">{detail.company}</p></div>
              <button className="btn-ghost !px-2" onClick={() => setDetail(null)} aria-label="Close details"><X className="h-4 w-4" /></button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[['Status', <StatusBadge value={detail.status} />], ['Owner', <Owner person={ownerOf(detail)} />], ['Estimated deal value', money(detail.estimatedValue)],
                ['Industry', detail.industry || '—'], ['Service interest', detail.serviceInterest || '—'], ['Est. asset volume', detail.assetVolume ? `${detail.assetVolume.toLocaleString()} assets` : '—'], ['Email', detail.email || '—'], ['Phone', detail.phone || '—'], ['Source', detail.source], ['Created', dateShort(detail.createdAt)], ['Notes', detail.notes || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{k}</dt><dd className="text-right text-slate-900">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary" onClick={() => { openForm(detail); setDetail(null); }}><Pencil className="h-4 w-4" />Edit</button>
              <button className="btn-danger" onClick={() => remove(detail)}><Trash2 className="h-4 w-4" />Delete</button>
            </div>
          </aside>
        </div>
      )}

      <LeadFormModal open={formOpen} lead={editing} salespeople={people} onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload({ silent: true }); }} />
    </>
  );
}
