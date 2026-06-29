import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Database, Store, Upload, TrendingUp, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '../components/StatsCard';
import { pricingApi } from '../services/api';
import type { UploadBatch } from '../types';

const statusBadge = (status: UploadBatch['status']) => {
  const map = {
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    processing: 'bg-yellow-100 text-yellow-700',
  };
  const icons = {
    completed: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    processing: <Clock className="w-3 h-3 animate-spin" />,
  };
  return (
    <span className={clsx('badge gap-1', map[status])}>
      {icons[status]} {status}
    </span>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => pricingApi.getStats().then(r => r.data),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time overview of your retail pricing feeds</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pricing Records"
          value={stats ? stats.total_records.toLocaleString() : '—'}
          subtitle="Across all stores"
          icon={Database}
          color="blue"
          loading={isLoading}
        />
        <StatsCard
          title="Active Stores"
          value={stats ? stats.total_stores.toLocaleString() : '—'}
          subtitle="Unique store IDs"
          icon={Store}
          color="green"
          loading={isLoading}
        />
        <StatsCard
          title="Upload Batches"
          value={stats ? stats.total_batches.toLocaleString() : '—'}
          subtitle="CSV files processed"
          icon={Upload}
          color="purple"
          loading={isLoading}
        />
        <StatsCard
          title="Average Price"
          value={stats?.avg_price != null ? `$${stats.avg_price.toFixed(2)}` : '—'}
          subtitle="Across all products"
          icon={TrendingUp}
          color="amber"
          loading={isLoading}
        />
      </div>

      {/* Recent uploads */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Recent Uploads</h2>
          <button
            onClick={() => navigate('/upload')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !stats?.recent_batches.length ? (
            <div className="p-12 text-center text-gray-400">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No feeds uploaded yet.</p>
              <button onClick={() => navigate('/upload')} className="btn-primary mt-4 mx-auto">
                Upload Your First Feed
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Records</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Errors</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[200px] truncate" title={b.original_filename}>
                      {b.original_filename}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{b.uploaded_at.split('T')[0]}</td>
                    <td className="px-5 py-3 text-right text-gray-800 font-medium">{b.record_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      {b.error_count > 0
                        ? <span className="text-red-500 font-medium">{b.error_count}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">{statusBadge(b.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/upload')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow group border-dashed border-2 border-blue-200 hover:border-blue-400 bg-blue-50/30"
        >
          <Upload className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-800">Upload Pricing Feed</h3>
          <p className="text-sm text-gray-500 mt-1">Import store pricing data from a CSV file</p>
        </div>
        <div
          onClick={() => navigate('/pricing')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow group border-dashed border-2 border-green-200 hover:border-green-400 bg-green-50/30"
        >
          <Database className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-800">Browse Pricing Records</h3>
          <p className="text-sm text-gray-500 mt-1">Search, filter and edit pricing data</p>
        </div>
      </div>
    </div>
  );
}
