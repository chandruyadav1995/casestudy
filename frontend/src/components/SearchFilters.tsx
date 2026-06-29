import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { PricingSearchParams } from '../types';

interface Props {
  onSearch: (params: PricingSearchParams) => void;
}

const empty: PricingSearchParams = {
  store_id: '', sku: '', product_name: '',
  price_min: '', price_max: '',
  date_from: '', date_to: '',
};

export default function SearchFilters({ onSearch }: Props) {
  const [filters, setFilters] = useState<PricingSearchParams>(empty);
  const [expanded, setExpanded] = useState(false);

  const set = (key: keyof PricingSearchParams, val: string) =>
    setFilters(f => ({ ...f, [key]: val }));

  const apply = () => {
    const clean: PricingSearchParams = {};
    (Object.keys(filters) as (keyof PricingSearchParams)[]).forEach(k => {
      const v = String(filters[k] ?? '').trim();
      if (v) (clean as Record<string, string>)[k] = v;
    });
    onSearch({ ...clean, page: 1 });
  };

  const clear = () => { setFilters(empty); onSearch({ page: 1 }); };

  const hasFilters = Object.values(filters).some(v => String(v).trim() !== '');

  return (
    <div className="card p-4 space-y-3">
      {/* Quick search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by Store ID, SKU, or Product Name…"
            value={filters.store_id ?? ''}
            onChange={e => set('store_id', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
          />
        </div>
        <button
          onClick={() => setExpanded(x => !x)}
          className="btn-secondary gap-1.5"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasFilters && <span className="badge bg-blue-100 text-blue-700 ml-1">●</span>}
        </button>
        <button onClick={apply} className="btn-primary">Search</button>
        {hasFilters && (
          <button onClick={clear} className="btn-secondary text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
            <input className="input" placeholder="e.g. MILK-2L" value={filters.sku ?? ''} onChange={e => set('sku', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
            <input className="input" placeholder="Full Cream…" value={filters.product_name ?? ''} onChange={e => set('product_name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Store ID</label>
            <input className="input" placeholder="STORE-0001" value={filters.store_id ?? ''} onChange={e => set('store_id', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Price ($)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={filters.price_min ?? ''} onChange={e => set('price_min', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Price ($)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="999.99" value={filters.price_max ?? ''} onChange={e => set('price_max', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 col-span-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
              <input className="input" type="date" value={filters.date_from ?? ''} onChange={e => set('date_from', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
              <input className="input" type="date" value={filters.date_to ?? ''} onChange={e => set('date_to', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
