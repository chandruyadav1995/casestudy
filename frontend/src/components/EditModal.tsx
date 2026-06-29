import { useEffect, useState } from 'react';
import { X, Save, Loader2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../services/api';
import type { PricingRecord } from '../types';

interface Props {
  record: PricingRecord | null;
  onClose: () => void;
}

interface FormState {
  store_id: string;
  sku: string;
  product_name: string;
  price: string;
  date: string;
}

export default function EditModal({ record, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>({ store_id: '', sku: '', product_name: '', price: '', date: '' });
  const [showAudit, setShowAudit] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    if (record) {
      setForm({
        store_id: record.store_id,
        sku: record.sku,
        product_name: record.product_name,
        price: String(record.price),
        date: record.date,
      });
      setErrors({});
      setShowAudit(false);
    }
  }, [record]);

  const { data: auditLogs } = useQuery({
    queryKey: ['audit', record?.id],
    queryFn: () => pricingApi.getAuditLog(record!.id).then(r => r.data),
    enabled: !!record && showAudit,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<PricingRecord>) => pricingApi.update(record!.id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing'] });
      onClose();
    },
  });

  if (!record) return null;

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.store_id.trim()) e.store_id = 'Required';
    if (!form.sku.trim()) e.sku = 'Required';
    if (!form.product_name.trim()) e.product_name = 'Required';
    const p = parseFloat(form.price);
    if (isNaN(p) || p < 0) e.price = 'Must be a non-negative number';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) e.date = 'Must be YYYY-MM-DD';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate({ ...form, price: parseFloat(form.price) as unknown as string & number });
  };

  const set = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Pricing Record</h2>
            <p className="text-xs text-gray-500 mt-0.5">ID #{record.id} · Last updated {record.updated_at.split('T')[0]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Store ID" error={errors.store_id}>
              <input className="input" value={form.store_id} onChange={e => set('store_id', e.target.value)} />
            </Field>
            <Field label="SKU" error={errors.sku}>
              <input className="input" value={form.sku} onChange={e => set('sku', e.target.value)} />
            </Field>
          </div>
          <Field label="Product Name" error={errors.product_name}>
            <input className="input" value={form.product_name} onChange={e => set('product_name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price ($)" error={errors.price}>
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
            </Field>
            <Field label="Effective Date" error={errors.date}>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </Field>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {(mutation.error as Error).message}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowAudit(a => !a)}
              className="btn-secondary text-xs gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              {showAudit ? 'Hide' : 'View'} History
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {/* Audit log */}
        {showAudit && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Change History</p>
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400">No changes recorded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {auditLogs.map(log => (
                  <li key={log.id} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400 whitespace-nowrap">{log.changed_at.split('T')[0]}</span>
                    <span className="font-medium">{log.field_changed}</span>
                    <span className="text-red-400 line-through">{log.old_value}</span>
                    <span>→</span>
                    <span className="text-green-600">{log.new_value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
