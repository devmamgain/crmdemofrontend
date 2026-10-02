import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Field, Spinner } from './ui.jsx';
import { createLead, updateLead } from '../services/api.js';
import { LEAD_STATUSES, LEAD_SOURCES, INDUSTRIES, SERVICE_TYPES } from '../utils/constants.js';
import { ownerOf } from '../utils/format.js';

const EMPTY = { name: '', company: '', industry: '', serviceInterest: '', assetVolume: 0, email: '', phone: '', source: 'Manual', status: 'New', estimatedValue: 0, salespersonId: '', notes: '' };

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Name is required';
  if (!f.company.trim()) e.company = 'Company is required';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (Number(f.assetVolume) < 0 || Number.isNaN(Number(f.assetVolume))) e.assetVolume = 'Must be 0 or more';
  if (Number(f.estimatedValue) < 0 || Number.isNaN(Number(f.estimatedValue))) e.estimatedValue = 'Must be 0 or more';
  return e;
}

export default function LeadFormModal({ open, lead, salespeople, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(lead ? { ...EMPTY, ...lead, salespersonId: ownerOf(lead)?._id || '' } : EMPTY);
  }, [open, lead]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { ...form, estimatedValue: Number(form.estimatedValue) || 0, assetVolume: Math.round(Number(form.assetVolume)) || 0 };
      delete payload._id; delete payload.createdAt; delete payload.updatedAt; delete payload.__v;
      lead ? await updateLead(lead._id, payload) : await createLead(payload);
      toast.success(lead ? 'Lead updated' : 'Lead created');
      onSaved();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Edit client lead' : 'New client lead'}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" form="lead-form" className="btn-primary" disabled={saving}>{saving && <Spinner />}{lead ? 'Save changes' : 'Create lead'}</button>
      </>}>
      <form id="lead-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Contact name *" htmlFor="l-name" error={errors.name}><input id="l-name" className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Client organization *" htmlFor="l-company" error={errors.company}><input id="l-company" className="input" value={form.company} onChange={set('company')} /></Field>
        <Field label="Industry" htmlFor="l-industry"><select id="l-industry" className="input" value={form.industry} onChange={set('industry')}><option value="">Select…</option>{INDUSTRIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Service interest" htmlFor="l-service"><select id="l-service" className="input" value={form.serviceInterest} onChange={set('serviceInterest')}><option value="">Select…</option>{SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Est. asset volume (units)" htmlFor="l-assets" error={errors.assetVolume}><input id="l-assets" type="number" min="0" className="input" value={form.assetVolume} onChange={set('assetVolume')} /></Field>
        <Field label="Email" htmlFor="l-email" error={errors.email}><input id="l-email" type="email" className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone" htmlFor="l-phone"><input id="l-phone" className="input" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Status" htmlFor="l-status"><select id="l-status" className="input" value={form.status} onChange={set('status')}>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Source" htmlFor="l-source"><select id="l-source" className="input" value={form.source} onChange={set('source')}>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Estimated deal value (USD)" htmlFor="l-value" error={errors.estimatedValue}><input id="l-value" type="number" min="0" className="input" value={form.estimatedValue} onChange={set('estimatedValue')} /></Field>
        <Field label="Owner" htmlFor="l-owner"><select id="l-owner" className="input" value={form.salespersonId} onChange={set('salespersonId')}><option value="">Unassigned</option>{salespeople?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="Notes" htmlFor="l-notes"><textarea id="l-notes" rows={3} className="input" value={form.notes} onChange={set('notes')} /></Field></div>
      </form>
    </Modal>
  );
}
