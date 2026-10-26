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

export function AppShell() {
  const { currentUser, isAdmin, isDeliveryBoy } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<NavTab>(isDeliveryBoy ? 'deliveries' : 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    if (isDeliveryBoy) {
      setActiveTab('deliveries');
    }
  }, [currentUser, isDeliveryBoy]);

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
    <div key={refreshKey} className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      {/* Top Header */}
      <Topbar
        onMenuToggle={() => setIsSidebarOpen(true)}
        onResetData={forceRefresh}
      />

      {/* Main Fluid Responsive Canvas */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Responsive Sidebar / Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar on Mobile Viewports */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

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
