import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Field, Spinner } from './ui.jsx';
import { addMarketData } from '../services/api.js';
import { ASSET_CATEGORIES } from '../utils/constants.js';

export default function AddMarketDataModal({ open, model, onClose, onSaved }) {
  const [form, setForm] = useState({ model: '', category: 'Laptop', brand: '', prices: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm({ model: model || '', category: 'Laptop', brand: '', prices: '' }); }, [open, model]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await addMarketData(form); toast.success('Market data saved'); onSaved(); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add comparable market data"
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" type="submit" form="md-form" disabled={saving}>{saving && <Spinner />}Save</button></>}>
      <form id="md-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Model *" htmlFor="m-model"><input id="m-model" required className="input" value={form.model} onChange={set('model')} /></Field></div>
        <Field label="Category" htmlFor="m-cat"><select id="m-cat" className="input" value={form.category} onChange={set('category')}>{ASSET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Brand" htmlFor="m-brand"><input id="m-brand" className="input" value={form.brand} onChange={set('brand')} /></Field>
        <div className="sm:col-span-2"><Field label="Comparable sale prices (USD, comma separated) *" htmlFor="m-prices"><input id="m-prices" required className="input" placeholder="420, 435, 410, 445" value={form.prices} onChange={set('prices')} /></Field>
          <p className="mt-1 text-xs text-slate-500">FMV is the median of these prices. Saved as user-supplied comparable transactions (demo data), not a verified market feed.</p></div>
      </form>
    </Modal>
  );
}
