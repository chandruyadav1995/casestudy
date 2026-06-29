import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PricingRecord, PricingSearchParams } from '../types';

interface Props {
  records: PricingRecord[];
  total: number;
  page: number;
  totalPages: number;
  sortBy: PricingSearchParams['sort_by'];
  sortOrder: PricingSearchParams['sort_order'];
  onSort: (col: PricingSearchParams['sort_by']) => void;
  onPageChange: (page: number) => void;
  onEdit: (record: PricingRecord) => void;
  loading?: boolean;
}

const COLS: { key: PricingSearchParams['sort_by']; label: string; align?: string }[] = [
  { key: 'store_id', label: 'Store ID' },
  { key: 'sku', label: 'SKU' },
  { key: 'product_name', label: 'Product Name' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'date', label: 'Effective Date' },
  { key: 'updated_at', label: 'Last Updated' },
];

function SortIcon({ col, sortBy, sortOrder }: { col: PricingSearchParams['sort_by']; sortBy?: string; sortOrder?: string }) {
  if (col !== sortBy) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
}

export default function PricingTable({
  records, total, page, totalPages, sortBy, sortOrder,
  onSort, onPageChange, onEdit, loading,
}: Props) {
  const fmtDate = (s: string) => s?.split('T')[0] ?? s;
  const fmtPrice = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLS.map(c => (
                <th
                  key={c.key}
                  className={clsx(
                    'px-4 py-3 font-semibold text-gray-600 select-none cursor-pointer hover:bg-gray-100 transition-colors',
                    c.align === 'right' ? 'text-right' : 'text-left'
                  )}
                  onClick={() => onSort(c.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    <SortIcon col={c.key} sortBy={sortBy} sortOrder={sortOrder} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...COLS, { key: 'actions' }].map((_col, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 1} className="px-4 py-16 text-center text-gray-400">
                  No records found. Try adjusting your search filters.
                </td>
              </tr>
            ) : (
              records.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700 bg-blue-50/30">{r.store_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.sku}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-[240px] truncate" title={r.product_name}>{r.product_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmtPrice(r.price)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(r.updated_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit record"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">
          {total === 0 ? 'No records' : `Showing ${((page - 1) * 50) + 1}–${Math.min(page * 50, total)} of ${total.toLocaleString()} records`}
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
            return (
              <button
                key={pg}
                onClick={() => onPageChange(pg)}
                className={clsx(
                  'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                  pg === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {pg}
              </button>
            );
          })}
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
