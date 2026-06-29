import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'amber';
  loading?: boolean;
}

const colors = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', loading }: Props) {
  const c = colors[color];
  return (
    <div className={clsx('card p-5 border', c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl', c.bg)}>
          <Icon className={clsx('w-5 h-5', c.icon)} />
        </div>
      </div>
    </div>
  );
}
