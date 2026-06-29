import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw } from 'lucide-react';
import SearchFilters from '../components/SearchFilters';
import PricingTable from '../components/PricingTable';
import EditModal from '../components/EditModal';
import { pricingApi } from '../services/api';
import type { PricingRecord, PricingSearchParams } from '../types';

function exportCsv(records: PricingRecord[]) {
  const headers = ['id', 'store_id', 'sku', 'product_name', 'price', 'date', 'updated_at'];
  const rows = records.map(r => headers.map(h => String((r as unknown as Record<string, unknown>)[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pricing-export.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Pricing() {
  const [params, setParams] = useState<PricingSearchParams>({ page: 1, limit: 50, sort_by: 'updated_at', sort_order: 'desc' });
  const [editRecord, setEditRecord] = useState<PricingRecord | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pricing', params],
    queryFn: () => pricingApi.search(params).then(r => r.data),
    placeholderData: prev => prev,
  });

  const handleSearch = (newParams: PricingSearchParams) => {
    setParams(p => ({ ...p, ...newParams, page: 1 }));
  };

  const handleSort = (col: PricingSearchParams['sort_by']) => {
    setParams(p => ({
      ...p,
      sort_by: col,
      sort_order: p.sort_by === col && p.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Records</h1>
          <p className="text-sm text-gray-500 mt-1">Search, filter and manage store pricing data</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {data?.data && data.data.length > 0 && (
            <button onClick={() => exportCsv(data.data)} className="btn-secondary">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <SearchFilters onSearch={handleSearch} />

      <PricingTable
        records={data?.data ?? []}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        totalPages={data?.total_pages ?? 1}
        sortBy={params.sort_by}
        sortOrder={params.sort_order}
        onSort={handleSort}
        onPageChange={p => setParams(prev => ({ ...prev, page: p }))}
        onEdit={setEditRecord}
        loading={isLoading}
      />

      <EditModal record={editRecord} onClose={() => setEditRecord(null)} />
    </div>
  );
}
