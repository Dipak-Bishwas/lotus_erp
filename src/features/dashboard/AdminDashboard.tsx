import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { StatCard } from '@/components/data-display/StatCard';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { DeliveryStatusBadge, InvoiceStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/feedback/InlineAlert';
import { formatCurrency, getTodayDateString, getCurrentMonthString } from '@/lib/formatters';
import { NavTab } from '@/components/layout/Sidebar';
import {
  Users,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  Plus,
  CalendarOff,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Customer, DailyDelivery, Invoice, Payment, User } from '@/types';

export function AdminDashboard({
  onNavigate,
  onOpenAddCustomer,
  onOpenRecordAbsence,
  onOpenRecordPayment,
}: {
  onNavigate: (tab: NavTab) => void;
  onOpenAddCustomer: () => void;
  onOpenRecordAbsence: () => void;
  onOpenRecordPayment: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [todayDeliveries, setTodayDeliveries] = useState<DailyDelivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<User[]>([]);

  const todayStr = getTodayDateString();
  const currentMonth = getCurrentMonthString();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const custs = StorageService.getCustomers();
    const dels = StorageService.getDeliveries(todayStr);
    const invs = StorageService.getInvoices();
    const pays = StorageService.getPayments();
    const boys = StorageService.getDeliveryBoys();

    setCustomers(custs);
    setTodayDeliveries(dels);
    setInvoices(invs);
    setPayments(pays);
    setDeliveryBoys(boys);
  };

  // Metrics
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE');
  const deliveredToday = todayDeliveries.filter(d => d.status === 'DELIVERED');
  const pendingToday = todayDeliveries.filter(d => d.status === 'PENDING');
  const vacationToday = todayDeliveries.filter(d => d.status === 'VACATION');
  const missedToday = todayDeliveries.filter(d => d.status === 'NOT_DELIVERED' || d.status === 'CUSTOMER_ABSENT');

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_outstanding || 0), 0);
  
  // Month payments
  const monthPayments = payments
    .filter(p => p.status === 'COMPLETED' && p.payment_date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  // Month finalized invoices total
  const monthInvoices = invoices
    .filter(i => i.billing_month === currentMonth && i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.total_payable, 0);

  return (
    <div className="space-y-6">
      {/* Pending Delivery Resolution Banner */}
      {pendingToday.length > 0 && (
        <InlineAlert
          variant="warning"
          title={`${pendingToday.length} Deliveries Pending Today`}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('deliveries')}
              className="bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
            >
              Resolve Now
            </Button>
          }
        >
          {pendingToday.length} customer deliveries for today ({todayStr}) have not yet been marked by delivery staff. Pending items must be confirmed before month-end billing.
        </InlineAlert>
      )}

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button
          onClick={onOpenAddCustomer}
          variant="primary"
          size="sm"
          className="shadow-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </Button>
        <Button
          onClick={onOpenRecordPayment}
          variant="secondary"
          size="sm"
          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Payment</span>
        </Button>
        <Button
          onClick={onOpenRecordAbsence}
          variant="secondary"
          size="sm"
          className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
        >
          <CalendarOff className="w-4 h-4" />
          <span>Record Leave / Vacation</span>
        </Button>
        <Button
          onClick={() => onNavigate('billing')}
          variant="outline"
          size="sm"
          className="text-slate-700"
        >
          <Receipt className="w-4 h-4" />
          <span>Generate Invoices</span>
        </Button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Clients"
          value={activeCustomers.length}
          subtitle="Subscribed daily flowers"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          label="Today Completed"
          value={`${deliveredToday.length}/${todayDeliveries.length}`}
          subtitle={`${pendingToday.length} pending, ${vacationToday.length} on leave`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          onClick={() => onNavigate('deliveries')}
        />
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle="Unpaid customer balance"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          onClick={() => onNavigate('billing')}
        />
        <StatCard
          label="Payments Collected"
          value={formatCurrency(monthPayments)}
          subtitle="This month's collections"
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
          onClick={() => onNavigate('payments')}
        />
      </div>

      {/* Today's Delivery Route Status Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Delivery Progress</h3>
            <p className="text-xs text-slate-500">Live summary of route deliveries for today</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate('deliveries')}
            className="text-blue-600 font-semibold"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Completion Rate</span>
            <span className="text-blue-600">
              {todayDeliveries.length > 0
                ? Math.round((deliveredToday.length / todayDeliveries.length) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{
                width: `${todayDeliveries.length ? (deliveredToday.length / todayDeliveries.length) * 100 : 0}%`,
              }}
              title="Delivered"
            />
            <div
              className="bg-blue-400 transition-all duration-300"
              style={{
                width: `${todayDeliveries.length ? (vacationToday.length / todayDeliveries.length) * 100 : 0}%`,
              }}
              title="Vacation"
            />
            <div
              className="bg-rose-400 transition-all duration-300"
              style={{
                width: `${todayDeliveries.length ? (missedToday.length / todayDeliveries.length) * 100 : 0}%`,
              }}
              title="Missed/Absent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Delivered: <strong>{deliveredToday.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Pending: <strong>{pendingToday.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
              On Leave: <strong>{vacationToday.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              Absent/Missed: <strong>{missedToday.length}</strong>
            </span>
          </div>
        </div>

        {/* Delivery Staff Allocation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {deliveryBoys.map((boy) => {
            const boyDels = todayDeliveries.filter(d => d.delivery_boy_id === boy.user_id);
            const boyDone = boyDels.filter(d => d.status === 'DELIVERED');
            return (
              <div
                key={boy.user_id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {boy.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{boy.name}</h5>
                    <p className="text-xs text-slate-500">
                      {boy.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-800">
                    {boyDone.length}/{boyDels.length}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Done</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent Billing & Unpaid Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Unpaid Balances List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Top Outstanding Balances
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('billing')}
                className="text-xs text-blue-600"
              >
                View Invoices
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {customers
                .filter(c => c.current_outstanding > 0)
                .slice(0, 4)
                .map((c) => (
                  <div key={c.customer_id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.address}</p>
                    </div>
                    <div className="text-right">
                      <MoneyDisplay
                        amount={c.current_outstanding}
                        highlightNegative
                        size="md"
                      />
                      <p className="text-[11px] text-slate-400">Due balance</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Need to collect payments?</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenRecordPayment}
              className="text-xs font-semibold"
            >
              Collect Now
            </Button>
          </div>
        </div>

        {/* Planned Leaves Notice */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Upcoming Planned Leaves & Vacations
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('absences')}
                className="text-xs text-blue-600"
              >
                All Leaves
              </Button>
            </div>
            <div className="space-y-2.5">
              {StorageService.getAbsences()
                .filter(a => a.status === 'APPROVED')
                .slice(0, 3)
                .map((abs) => {
                  const cust = StorageService.getCustomer(abs.customer_id);
                  return (
                    <div
                      key={abs.absence_id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {cust?.name || abs.customer_id}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                            {abs.total_days} days
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{abs.reason}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Dates: {abs.start_date} to {abs.end_date}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        Excluded from Bill
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Customer travelling?</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenRecordAbsence}
              className="text-xs font-semibold"
            >
              Add Absence
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
