import { useState } from 'react';
import { Sparkles, Plus, Check, MapPin, Building2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateAILeads, createLead, getSalespeople } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { PageHeader, Field, EmptyState, Spinner, Badge, Skeleton } from '../components/ui.jsx';

export default function AiLeads() {
  const [form, setForm] = useState({ industry: '', region: '', product: '', idealCustomer: '' });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState({});
  const [ownerId, setOwnerId] = useState('');
  const { data: people } = useFetch(getSalespeople);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generate(e) {
    e.preventDefault();
    setBusy(true); setAdded({});
    try { setResult(await generateAILeads(form)); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  async function addLead(s, i) {
    try {
      await createLead({
        name: s.name, company: s.name, source: 'AI Suggestion', status: 'New', salespersonId: ownerId || null,
        serviceInterest: 'IT Asset Recovery', industry: s.industry,
        notes: `AI-generated prospect suggestion (unverified).\nIndustry: ${s.industry} · Location: ${s.location}\nWhy: ${s.reason}\nOutreach angle: ${s.outreachAngle}`,
      });
      setAdded((a) => ({ ...a, [i]: true }));
      toast.success('Added to Leads');
    } catch (err) { toast.error(err.message); }
  }

  return (
    <>
      <PageHeader title="AI Prospecting" description="Describe a target client profile and get AI-generated ITAD prospect suggestions to review." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={generate} className="card h-fit space-y-4 p-5 lg:col-span-1">
          <Field label="Target industry *" htmlFor="a-ind"><input id="a-ind" required className="input" placeholder="Healthcare" value={form.industry} onChange={set('industry')} /></Field>
          <Field label="Target region *" htmlFor="a-reg"><input id="a-reg" required className="input" placeholder="Midwest United States" value={form.region} onChange={set('region')} /></Field>
          <Field label="Service offering *" htmlFor="a-prod"><input id="a-prod" required className="input" placeholder="IT asset recovery & remarketing" value={form.product} onChange={set('product')} /></Field>
          <Field label="Ideal customer" htmlFor="a-ideal"><textarea id="a-ideal" rows={3} className="input" placeholder="e.g. 500+ employees, refreshes laptops every 3–4 years, needs certified data destruction" value={form.idealCustomer} onChange={set('idealCustomer')} /></Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : <Sparkles className="h-4 w-4" />}{busy ? 'Generating AI insights…' : 'Generate Lead Suggestions'}</button>
        </form>

        <div className="lg:col-span-2">
          {busy ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
            : !result ? <div className="card"><EmptyState icon={Sparkles} title="No AI suggestions generated" description="Fill in the target profile and generate suggestions." /></div>
            : (
              <>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex max-w-xl items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><b>AI-generated prospect suggestions.</b> {result.disclaimer} {result.note}</span></div>
                  <select className="input !w-48" aria-label="Assign added leads to" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}><option value="">Assign to: nobody</option>{people?.map((p) => <option key={p._id} value={p._id}>Assign to: {p.name}</option>)}</select>
                </div>
                <ul className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />{s.name}
                            <Badge tone="gray">{s.kind === 'example_company' ? 'Example company' : 'Prospect type'}</Badge></h3>
                          <p className="mt-1 flex items-center gap-3 text-xs text-slate-500"><span>{s.industry}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{s.location}</span>
                            {s.fitScore > 0 && <span title="Subjective AI estimate, not an objective score">Fit (AI estimate): {s.fitScore}</span>}</p>
                        </div>
                        <button className={added[i] ? 'btn-secondary' : 'btn-primary'} disabled={added[i]} onClick={() => addLead(s, i)}>{added[i] ? <><Check className="h-4 w-4" />Added</> : <><Plus className="h-4 w-4" />Add to Leads</>}</button>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{s.reason}</p>
                      <p className="mt-2 text-sm text-slate-600"><span className="font-medium text-slate-900">Outreach angle: </span>{s.outreachAngle}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
        </div>
      </div>
    </>
  );
}
