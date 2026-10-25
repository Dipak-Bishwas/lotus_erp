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
              onClick={() => onSelectTab('deliveries')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'deliveries' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>Deliveries</span>
            </button>

            <button
              onClick={() => onSelectTab('customers')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'customers' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Clients</span>
            </button>

            <button
              onClick={() => onSelectTab('billing')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[54px]',
                activeTab === 'billing' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Billing</span>
            </button>

            <button
              onClick={onOpenMenu}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-all tap-highlight min-w-[54px]"
            >
              <Menu className="w-5 h-5 mb-0.5" />
              <span>More</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onSelectTab('deliveries')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[64px]',
                activeTab === 'deliveries' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Truck className="w-5 h-5 mb-0.5" />
              <span>My Route</span>
            </button>

            <button
              onClick={() => onSelectTab('customers')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[64px]',
                activeTab === 'customers' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span>Addresses</span>
            </button>

            <button
              onClick={() => onSelectTab('absences')}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-semibold transition-all tap-highlight min-w-[64px]',
                activeTab === 'absences' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <CalendarOff className="w-5 h-5 mb-0.5" />
              <span>Leaves</span>
            </button>

            <button
              onClick={onOpenMenu}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-all tap-highlight min-w-[64px]"
            >
              <Menu className="w-5 h-5 mb-0.5" />
              <span>Menu</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
