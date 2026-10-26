import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { 
  Flower2, 
  Menu, 
  RotateCcw, 
  Truck, 
  ShieldAlert,
  CalendarDays,
  Sparkles,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { formatDate, getTodayDateString } from '@/lib/formatters';

export function Topbar({
  onMenuToggle,
  onResetData,
}: {
  onMenuToggle: () => void;
  onResetData: () => void;
}) {
  const { currentUser, switchUser, availableUsers, isAdmin, logout } = useAuth();
  const { showToast } = useToast();

  const handleReset = () => {
    if (window.confirm('Reset all demo data back to clean BRD baseline?')) {
      StorageService.resetAll();
      showToast('Data Reset', 'All data restored to clean BRD demo baseline', 'info');
      onResetData();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-2.5 transition-all shadow-xs shrink-0">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors tap-highlight"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white">
                <Flower2 className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-blue-900 bg-clip-text text-transparent">
                  Lotus ERP
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-blue-500" />
                  v1.0 BRD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Daily Flower Delivery & Monthly Billing Management
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatDate(getTodayDateString())}</span>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-gradient-to-r from-slate-50 to-slate-100 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 text-xs font-semibold text-slate-600">
              {isAdmin ? (
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-[11px] uppercase tracking-wider font-bold">User:</span>
            </div>

            <div className="relative">
              <select
                value={currentUser.user_id}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-white text-xs font-extrabold text-slate-800 rounded-lg py-1.5 pl-2.5 pr-7 border border-slate-200/70 shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                {availableUsers.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.role === 'ADMIN' ? '👑 Owner: ' : '🚴 Route: '}
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            title="Reset to initial BRD baseline data"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors tap-highlight border border-transparent hover:border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors tap-highlight border border-rose-100 shadow-2xs flex items-center gap-1 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
