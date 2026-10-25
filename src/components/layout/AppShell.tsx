import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Topbar } from './Topbar';
import { Sidebar, NavTab } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { DeliveryBoyRouteView } from '@/features/delivery/DeliveryBoyRouteView';
import { DailyDeliveryView } from '@/features/delivery/DailyDeliveryView';
import { CustomerList } from '@/features/customers/CustomerList';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { AbsenceManagementView } from '@/features/absences/AbsenceManagementView';
import { BillingView } from '@/features/billing/BillingView';
import { PaymentManagementView } from '@/features/payments/PaymentManagementView';
import { CustomerLedgerView } from '@/features/ledger/CustomerLedgerView';
import { StaffManagementView } from '@/features/staff/StaffManagementView';
import { ReportsView } from '@/features/reports/ReportsView';
import { AuditLogView } from '@/features/audit/AuditLogView';
import { Customer } from '@/types';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Wifi, Battery, Signal, Smartphone } from 'lucide-react';

export function AppShell() {
  const { currentUser, isAdmin, isDeliveryBoy } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global modals triggered from shortcuts
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [targetCustomerId, setTargetCustomerId] = useState<string | undefined>(undefined);

  const forceRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOpenAddCustomer = () => {
    setIsAddCustomerOpen(true);
  };

  const handleOpenRecordAbsence = (cust?: Customer) => {
    setTargetCustomerId(cust?.customer_id);
    setActiveTab('absences');
  };

  const handleOpenRecordPayment = (cust?: Customer) => {
    setTargetCustomerId(cust?.customer_id);
    setActiveTab('payments');
  };

  const handleViewLedger = (cust: Customer) => {
    setTargetCustomerId(cust.customer_id);
    setActiveTab('ledger');
  };

  // Render the core active screen content
  const renderMainContent = () => {
    // If delivery boy and on dashboard or deliveries tab, show the live mobile route view
    if (isDeliveryBoy && (activeTab === 'dashboard' || activeTab === 'deliveries')) {
      return <DeliveryBoyRouteView />;
    }

    if (isAdmin && activeTab === 'dashboard') {
      return (
        <AdminDashboard
          onNavigate={setActiveTab}
          onOpenAddCustomer={handleOpenAddCustomer}
          onOpenRecordAbsence={() => handleOpenRecordAbsence()}
          onOpenRecordPayment={() => handleOpenRecordPayment()}
        />
      );
    }

    if (isAdmin && activeTab === 'deliveries') {
      return <DailyDeliveryView />;
    }

    if (activeTab === 'customers') {
      return (
        <CustomerList
          onRecordPayment={handleOpenRecordPayment}
          onRecordAbsence={handleOpenRecordAbsence}
          onViewLedger={handleViewLedger}
        />
      );
    }

    if (activeTab === 'absences') {
      return <AbsenceManagementView initialCustomerId={targetCustomerId} />;
    }

    if (activeTab === 'billing') {
      return <BillingView onRecordPayment={handleOpenRecordPayment} />;
    }

    if (activeTab === 'payments') {
      return <PaymentManagementView initialCustomerId={targetCustomerId} />;
    }

    if (activeTab === 'ledger') {
      return <CustomerLedgerView initialCustomerId={targetCustomerId} />;
    }

    if (activeTab === 'staff') {
      return <StaffManagementView />;
    }

    if (activeTab === 'reports') {
      return <ReportsView />;
    }

    if (activeTab === 'audit') {
      return <AuditLogView />;
    }

    return null;
  };

  return (
    <div key={refreshKey} className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Header */}
      <Topbar
        onMenuToggle={() => setIsSidebarOpen(true)}
        onResetData={forceRefresh}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
      />

      {/* Main Container */}
      {isMobilePreview ? (
        /* ================= MOBILE SIMULATOR PHONE FRAME ================= */
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-900/95 min-h-[calc(100vh-61px)] overflow-y-auto">
          <div className="mb-3 text-center text-slate-400 text-xs flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Interactive Mobile Phone Simulator (390 × 844 px)</span>
          </div>

          {/* iPhone Frame */}
          <div className="relative w-[390px] h-[820px] bg-white rounded-[50px] shadow-2xl ring-12 ring-slate-800 ring-offset-4 ring-offset-slate-950 flex flex-col overflow-hidden border border-slate-700/50">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <span className="w-2 h-2 rounded-full bg-blue-900/40" />
            </div>

            {/* Mobile Status Bar */}
            <div className="pt-3 pb-1 px-7 flex items-center justify-between text-[11px] font-bold text-slate-800 select-none z-40 bg-white">
              <span>6:30</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4" />
              </div>
            </div>

            {/* Scrollable Mobile Viewport */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 bg-[#F8FAFC]">
              {renderMainContent()}
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onOpenMenu={() => setIsSidebarOpen(true)}
            />

            {/* iPhone Home Bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400 rounded-full z-50 pointer-events-none" />
          </div>
        </div>
      ) : (
        /* ================= FULL VIEWPORT DESKTOP / TABLET LAYOUT ================= */
        <div className="flex-1 flex w-full">
          {/* Responsive Sidebar / Mobile Drawer */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Fluid Content Canvas */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
            {renderMainContent()}
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Active on native mobile viewports when not in phone simulator) */}
      {!isMobilePreview && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Global Add Customer Modal */}
      <CustomerFormModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={(c) => {
          StorageService.saveCustomer(c, currentUser);
          showToast('Customer Created', `${c.name} added successfully`, 'success');
          forceRefresh();
        }}
        areas={StorageService.getAreas()}
        deliveryBoys={StorageService.getDeliveryBoys()}
      />
    </div>
  );
}
