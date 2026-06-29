import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, Tag, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Feeds' },
  { to: '/pricing', icon: Tag, label: 'Pricing Records' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-blue-900 text-white shadow-lg">
        <div className="px-5 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-300" />
            <span className="font-bold text-lg tracking-tight">RetailPrice</span>
          </div>
          <p className="text-blue-400 text-xs mt-0.5">Pricing Feed Manager</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-blue-800">
          <p className="text-blue-400 text-xs">v1.0.0 · Enterprise Edition</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-8 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
