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
              <img
                src="/favicon.png"
                alt="Lotus ERP"
                className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-blue-500/25 ring-2 ring-white"
              />
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

          {/* Logged in User Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700">
            {isAdmin ? (
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            ) : (
              <Truck className="w-4 h-4 text-emerald-600" />
            )}
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {isAdmin ? 'Administrator' : 'Delivery Staff'}
              </span>
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
