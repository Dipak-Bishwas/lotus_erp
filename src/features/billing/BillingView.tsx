import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { BillingEngine, BillPreviewResult } from '@/lib/billingEngine';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { InlineAlert } from '@/components/feedback/InlineAlert';
import { formatCurrency, formatMonthYear, getCurrentMonthString } from '@/lib/formatters';
import { Invoice, Customer } from '@/types';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import {
  Receipt,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';

export function BillingView({
  onRecordPayment,
}: {
  onRecordPayment: (c: Customer) => void;
}) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [previews, setPreviews] = useState<BillPreviewResult[]>([]);
  const [finalizedInvoices, setFinalizedInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Finalize confirmation modal
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [selectedMonth]);

  const loadBillingData = () => {
    // Dynamic preview calculation
    const calculatedPreviews = BillingEngine.generateAllInvoicesPreview(selectedMonth);
    setPreviews(calculatedPreviews);

    // Existing finalized invoices in storage for this month
    const invs = StorageService.getInvoices().filter((i) => i.billing_month === selectedMonth);
    setFinalizedInvoices(invs);
  };

  const handleFinalizeAll = () => {
    setIsFinalizing(true);
    try {
      previews.forEach((prev) => {
        const inv = BillingEngine.createInvoiceFromPreview(prev);
        StorageService.finalizeInvoice(inv, currentUser);
      });
      showToast(
        'Invoices Finalized',
        `Successfully generated and locked ${previews.length} bills for ${formatMonthYear(selectedMonth)}`,
        'success'
      );
      setIsFinalizeModalOpen(false);
      loadBillingData();
    } catch (e) {
      console.error(e);
      showToast('Error', 'Failed to finalize invoices', 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleViewInvoice = (customerId: string) => {
    const finalized = finalizedInvoices.find((i) => i.customer_id === customerId);
    if (finalized) {
      setSelectedInvoice(finalized);
    } else {
      const preview = previews.find((p) => p.customer.customer_id === customerId);
      if (preview) {
        setSelectedInvoice(BillingEngine.createInvoiceFromPreview(preview));
      }
    }
  };

  // Metrics
  const totalBillableDeliveries = previews.reduce((sum, p) => sum + p.billableDays, 0);
  const totalCurrentCharges = previews.reduce((sum, p) => sum + p.currentCharges, 0);
  const totalPayableOverall = previews.reduce((sum, p) => sum + p.totalPayable, 0);
  const totalPaidOverall = previews.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalClosingBalance = previews.reduce((sum, p) => sum + p.closingBalance, 0);
  const totalPendingUnresolved = previews.reduce((sum, p) => sum + p.unresolvedPendingCount, 0);

  const isMonthFinalized = finalizedInvoices.length > 0;

  return (
    <div className="space-y-4">
      {/* Top Bar with Month Selector & Finalize CTA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Monthly Billing & Invoicing</h2>
              {isMonthFinalized && (
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Finalized
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Calculate exact monthly flower billings from confirmed delivery records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </Select>

            {isAdmin && !isMonthFinalized && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsFinalizeModalOpen(true)}
                className="text-xs whitespace-nowrap shadow-sm font-semibold"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                <span>Finalize Invoices</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Unresolved Records Gate Warning (BRD Section 5 & TDD Section 10) */}
      {totalPendingUnresolved > 0 && (
        <InlineAlert
          variant="warning"
          title={`${totalPendingUnresolved} Unresolved Pending Deliveries in ${formatMonthYear(selectedMonth)}`}
        >
          According to BRD business rules, pending deliveries are never automatically billed as delivered. Please resolve today's route status before final invoice lock.
        </InlineAlert>
      )}

      {/* Monthly Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs font-semibold text-slate-400 uppercase">Confirmed Deliveries</p>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalBillableDeliveries} Days
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Eligible billable records</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs font-semibold text-slate-400 uppercase">Month Flower Charges</p>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {formatCurrency(totalCurrentCharges)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From active daily subscriptions</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Receivable</p>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
            {formatCurrency(totalPayableOverall)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Includes carry-forward balances</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Due Remaining</p>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
            {formatCurrency(totalClosingBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Paid so far: {formatCurrency(totalPaidOverall)}
          </p>
        </div>
      </div>

      {/* Invoice Table / Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {isMonthFinalized ? 'Finalized Customer Invoices' : 'Draft Billing Preview'} (
            {previews.length} Customers)
          </h3>
          <span className="text-xs text-slate-500">
            Formula: Deliveries × Rate + Opening Balance − Paid
          </span>
        </div>

        {/* Mobile Cards (<640px) */}
        <div className="sm:hidden space-y-3">
          {previews.map((item) => (
            <div
              key={item.customer.customer_id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.customer.name}</h4>
                  <p className="text-xs text-slate-400">{item.customer.address}</p>
                </div>
                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                  ₹{item.dailyRate}/day
                </span>
              </div>

              {/* Day breakdown */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Delivered</span>
                  <strong className="text-emerald-700">{item.billableDays} days</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vacation</span>
                  <strong className="text-slate-700">{item.absenceDays} days</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Charges</span>
                  <strong className="text-slate-900 font-mono">
                    {formatCurrency(item.currentCharges)}
                  </strong>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-1 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Previous Carry:</span>
                  <span className="font-mono">{formatCurrency(item.openingBalance)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-blue-700">{formatCurrency(item.totalPayable)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Paid:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(item.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Due Balance:</span>
                  <MoneyDisplay
                    amount={item.closingBalance}
                    highlightNegative
                    size="md"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewInvoice(item.customer.customer_id)}
                  className="text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>View Bill</span>
                </Button>

                {item.closingBalance > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRecordPayment(item.customer)}
                    className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <span>Collect Payment</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (>=640px) */}
        <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Calendar</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-center">Leaves</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Month Charges</th>
                <th className="py-3 px-4">Carry Balance</th>
                <th className="py-3 px-4">Total Payable</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Due Remaining</th>
                <th className="py-3 px-4 text-right">Bill Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {previews.map((item) => (
                <tr key={item.customer.customer_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{item.customer.name}</p>
                    <p className="text-[11px] text-slate-400">{item.customer.flower_type}</p>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">
                    {item.totalCalendarDays}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">
                    {item.billableDays}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    {item.absenceDays > 0 ? (
                      <span className="font-semibold text-purple-600">{item.absenceDays} d</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {formatCurrency(item.dailyRate)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(item.currentCharges)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {formatCurrency(item.openingBalance)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {formatCurrency(item.totalPayable)}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600">
                    {formatCurrency(item.amountPaid)}
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                    <MoneyDisplay
                      amount={item.closingBalance}
                      highlightNegative
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewInvoice(item.customer.customer_id)}
                      className="text-xs p-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>View</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finalize Invoices Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        onConfirm={handleFinalizeAll}
        title={`Finalize ${formatMonthYear(selectedMonth)} Invoices?`}
        description={`This will generate immutable invoice snapshots for all ${previews.length} customers, post charges to each customer's account ledger, and lock the billing cycle. Finalized bills cannot be silently rewritten.`}
        confirmLabel="Finalize & Lock Invoices"
        variant="primary"
        isLoading={isFinalizing}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onRecordPayment={onRecordPayment}
      />
    </div>
  );
}
