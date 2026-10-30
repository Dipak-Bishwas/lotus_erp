import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { NavTab } from './Sidebar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Truck,
  Users,
  Receipt,
  Menu,
  CalendarOff,
} from 'lucide-react';

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenMenu,
}: {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
}) {
  const { isAdmin } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around">
        {isAdmin ? (
          <>
            <button
              onClick={() => onSelectTab('dashboard')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectTab('customers')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'customers' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => onSelectTab('payments')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'payments' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Payments</span>
            </button>

            <button
              onClick={() => onSelectTab('staff')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'staff' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>Staff</span>
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full px-4 py-1">
            <button
              onClick={() => onSelectTab('customers')}
              className={cn(
                'flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all tap-highlight',
                activeTab === 'customers' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
              )}
            >
              <Users className="w-4 h-4" />
              <span>My Assigned Clients</span>
            </button>

            <button
              onClick={onOpenMenu}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
