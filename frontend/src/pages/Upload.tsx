import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, CheckCircle, XCircle, Clock, FileText, Download, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import FileUpload from '../components/FileUpload';
import { feedsApi } from '../services/api';
import type { UploadBatch } from '../types';

const statusBadge = (status: UploadBatch['status']) => {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    processing: 'bg-yellow-100 text-yellow-700',
  };
  const icons = {
    completed: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    processing: <Clock className="w-3 h-3" />,
  };
  return <span className={clsx('badge gap-1', styles[status])}>{icons[status]} {status}</span>;
};

const SAMPLE_CSV = `store_id,sku,product_name,price,date
STORE-0001,MILK-2L,Full Cream Milk 2L,3.50,2024-06-15
STORE-0001,BREAD-WW,Wholemeal Bread 700g,4.20,2024-06-15
STORE-0002,MILK-2L,Full Cream Milk 2L,3.65,2024-06-15
STORE-0002,EGG-12,Free Range Eggs 12pk,6.80,2024-06-15
STORE-0003,CHKN-BRST,Chicken Breast 1kg,12.00,2024-06-15`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample-pricing-feed.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Upload() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['feeds', page],
    queryFn: () => feedsApi.list(page, 10).then(r => r.data),
    retry: 1,
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this feed and all its records?')) return;
    setDeletingId(id);
    try {
      await feedsApi.delete(id);
      qc.invalidateQueries({ queryKey: ['feeds'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Pricing Feeds</h1>
        <p className="text-sm text-gray-500 mt-1">Import store pricing data via CSV files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Upload CSV File</h2>
            <FileUpload onSuccess={() => { refetch(); qc.invalidateQueries({ queryKey: ['stats'] }); }} />
          </div>
        </div>

        {/* Instructions panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">CSV Format Requirements</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex gap-2"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">store_id</span><span>Store identifier (max 50 chars)</span></div>
              <div className="flex gap-2"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">sku</span><span>Product SKU (max 100 chars)</span></div>
              <div className="flex gap-2"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">product_name</span><span>Product name (max 255 chars)</span></div>
              <div className="flex gap-2"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">price</span><span>Positive decimal (e.g. 3.99)</span></div>
              <div className="flex gap-2"><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">date</span><span>YYYY-MM-DD format</span></div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Duplicate records (same store_id + SKU + date) will be <strong>overwritten</strong> with the latest values.</p>
            </div>
            <button onClick={downloadSample} className="btn-secondary w-full justify-center mt-4 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV
            </button>
          </div>
        </div>
      </div>

      {/* Upload history */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Upload History</h2>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
            <p className="text-sm text-red-600 font-medium">Failed to load upload history</p>
            <p className="text-xs text-gray-500">{(error as Error)?.message}</p>
            <button onClick={() => refetch()} className="btn-secondary text-xs mx-auto">Retry</button>
          </div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No uploads yet.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['File', 'Uploaded', 'Total', 'Imported', 'Errors', 'Status', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[180px] truncate" title={b.original_filename}>{b.original_filename}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{b.uploaded_at.split('T')[0]}</td>
                    <td className="px-5 py-3 text-gray-800">{b.record_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{b.success_count.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      {b.error_count > 0 ? <span className="text-red-500 font-medium">{b.error_count}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">{statusBadge(b.status)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete feed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.total_pages > 1 && (
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
                {Array.from({ length: data.total_pages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={clsx('w-8 h-8 rounded text-sm', page === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
