import { useEffect, useState } from 'react';
import { Plus, Calendar, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeals, updateDeal, getSalespeople } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, Badge, STATUS_TONE, Owner, Skeleton } from '../components/ui.jsx';
import DealFormModal from '../components/DealFormModal.jsx';
import { DEAL_STAGES, stageLabel } from '../utils/constants.js';
import { money, dateShort, ownerOf } from '../utils/format.js';

const COL_ACCENT = { New: 'bg-blue-500', Qualified: 'bg-violet-500', Proposal: 'bg-amber-500', Negotiation: 'bg-orange-500', Won: 'bg-emerald-500', Lost: 'bg-red-500' };

export default function Deals() {
  const [owner, setOwner] = useState('');
  const { data: people } = useFetch(getSalespeople);
  const { data, loading, reload } = useFetch(() => getDeals({ salespersonId: owner || undefined }), [owner]);
  const [deals, setDeals] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { if (data) setDeals(data.data); }, [data]);
  const totals = Object.fromEntries((data?.summary || []).map((s) => [s.stage, s]));

  async function moveDeal(id, stage) {
    const deal = deals.find((d) => d._id === id);
    if (!deal || deal.stage === stage) return;
    const previous = deals;
    setDeals((ds) => ds.map((d) => (d._id === id ? { ...d, stage } : d))); // optimistic
    try {
      await updateDeal(id, { stage });
      toast.success(`Moved to ${stageLabel(stage)}`);
      reload({ silent: true }); // refresh column totals from the database
    } catch (e) {
      setDeals(previous);
      toast.error(e.message);
    }
  }

  const openForm = (deal = null) => { setEditing(deal); setFormOpen(true); };

  return (
    <>
      <PageHeader title="Deals Pipeline" description="Drag opportunities between stages. Every move is saved to the database."
        actions={<>
          <select className="input !w-48" aria-label="Filter by salesperson" value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">All salespeople</option>{people?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => openForm()}><Plus className="h-4 w-4" />New opportunity</button>
        </>} />

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-4">
          {DEAL_STAGES.map((stage) => {
            const col = deals.filter((d) => d.stage === stage);
            const t = totals[stage];
            return (
              <section key={stage} aria-label={`${stageLabel(stage)} column`}
                className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-100/70 transition-colors ${overStage === stage ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
                onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
                onDrop={(e) => { e.preventDefault(); setOverStage(null); if (dragId) moveDeal(dragId, stage); setDragId(null); }}>
                <header className="p-3">
                  <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${COL_ACCENT[stage]}`} /><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{stageLabel(stage)}</h2></div>
                  <p className="mt-1 text-xs text-slate-500">{loading ? '…' : `${t?.count ?? 0} deals`} · <span className="font-medium text-slate-700">{loading ? '' : money(t?.value)}</span></p>
                </header>
                <div className="min-h-[8rem] flex-1 space-y-2 px-3 pb-3">
                  {loading ? <Skeleton className="h-24" /> : col.length === 0 ? (
                    <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 py-8 text-xs text-slate-400"><Briefcase className="mb-1 h-4 w-4" />No opportunities in this stage</div>
                  ) : col.map((d) => (
                    <article key={d._id} draggable onDragStart={() => setDragId(d._id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openForm(d)} onClick={() => openForm(d)}
                      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow active:cursor-grabbing ${dragId === d._id ? 'opacity-40' : ''}`}>
                      <p className="text-sm font-medium leading-snug text-slate-900">{d.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{d.company}</p>
                      <p className="mt-2 text-xs text-slate-600">{d.serviceType || 'IT Asset Recovery'}{d.assetCount ? ` · ${d.assetCount.toLocaleString()} assets` : ''}</p>
                      <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold text-slate-900">{money(d.value)}</span><Badge tone={STATUS_TONE[d.priority]}>{d.priority}</Badge></div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <Owner person={ownerOf(d)} />
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" />{dateShort(d.expectedCloseDate)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <DealFormModal open={formOpen} deal={editing} salespeople={people} onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); reload({ silent: true }); }} />
    </>
  );
}
