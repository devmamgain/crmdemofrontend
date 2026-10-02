import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Field, Spinner } from './ui.jsx';
import { createDeal, updateDeal, deleteDeal } from '../services/api.js';
import { DEAL_STAGES, PRIORITIES, SERVICE_TYPES, stageLabel } from '../utils/constants.js';
import { ownerOf } from '../utils/format.js';

const EMPTY = { title: '', company: '', serviceType: 'IT Asset Recovery', assetCount: 0, value: 0, stage: 'New', priority: 'Medium', expectedCloseDate: '', description: '', salespersonId: '' };

export default function DealFormModal({ open, deal, salespeople, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(deal ? { ...EMPTY, ...deal, salespersonId: ownerOf(deal)?._id || '', expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '' } : EMPTY);
  }, [open, deal]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (Number(form.value) < 0 || Number.isNaN(Number(form.value))) errs.value = 'Must be 0 or more';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { title: form.title, company: form.company, value: Number(form.value) || 0, serviceType: form.serviceType, assetCount: Math.round(Number(form.assetCount)) || 0, stage: form.stage, priority: form.priority, expectedCloseDate: form.expectedCloseDate || null, description: form.description, salespersonId: form.salespersonId || null };
      deal ? await updateDeal(deal._id, payload) : await createDeal(payload);
      toast.success(deal ? 'Deal updated' : 'Deal created');
      onSaved();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function remove() {
    if (!window.confirm(`Delete opportunity "${deal.title}"?`)) return;
    try { await deleteDeal(deal._id); toast.success('Deal deleted'); onSaved(); } catch (err) { toast.error(err.message); }
  }

  return (
    <Modal open={open} onClose={onClose} title={deal ? 'Edit opportunity' : 'New opportunity'}
      footer={<>
        {deal && <button type="button" className="btn-danger mr-auto" onClick={remove}>Delete</button>}
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" form="deal-form" className="btn-primary" disabled={saving}>{saving && <Spinner />}{deal ? 'Save changes' : 'Create deal'}</button>
      </>}>
      <form id="deal-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><Field label="Title *" htmlFor="d-title" error={errors.title}><input id="d-title" className="input" value={form.title} onChange={set('title')} /></Field></div>
        <Field label="Client organization *" htmlFor="d-company" error={errors.company}><input id="d-company" className="input" value={form.company} onChange={set('company')} /></Field>
        <Field label="Expected deal value (USD)" htmlFor="d-value" error={errors.value}><input id="d-value" type="number" min="0" className="input" value={form.value} onChange={set('value')} /></Field>
        <Field label="Service" htmlFor="d-service"><select id="d-service" className="input" value={form.serviceType} onChange={set('serviceType')}>{SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Asset count (units)" htmlFor="d-assets"><input id="d-assets" type="number" min="0" className="input" value={form.assetCount} onChange={set('assetCount')} /></Field>
        <Field label="Stage" htmlFor="d-stage"><select id="d-stage" className="input" value={form.stage} onChange={set('stage')}>{DEAL_STAGES.map((s) => <option key={s} value={s}>{stageLabel(s)}</option>)}</select></Field>
        <Field label="Priority" htmlFor="d-priority"><select id="d-priority" className="input" value={form.priority} onChange={set('priority')}>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Salesperson" htmlFor="d-owner"><select id="d-owner" className="input" value={form.salespersonId} onChange={set('salespersonId')}><option value="">Unassigned</option>{salespeople?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field>
        <Field label="Expected close date" htmlFor="d-date"><input id="d-date" type="date" className="input" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} /></Field>
        <div className="sm:col-span-2"><Field label="Description" htmlFor="d-desc"><textarea id="d-desc" rows={3} className="input" value={form.description} onChange={set('description')} /></Field></div>
      </form>
    </Modal>
  );
}
