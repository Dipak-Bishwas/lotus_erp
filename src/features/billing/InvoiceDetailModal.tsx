import React from 'react';
import { Invoice, Customer } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { InvoiceStatusBadge } from '@/components/ui/Badge';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/formatters';
import { StorageService } from '@/lib/storage';
import {
  Printer,
  Share2,
  Flower2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building,
  Phone
} from 'lucide-react';

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onRecordPayment?: (c: Customer) => void;
}) {
  if (!invoice) return null;

  const customer = StorageService.getCustomer(invoice.customer_id);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!customer) return;
    const msg = `🌺 *LOTUS FLOWER SHOP - MONTHLY BILL* 🌺\n` +
      `Bill No: ${invoice.invoice_number}\n` +
      `Customer: ${customer.name}\n` +
      `Period: ${formatMonthYear(invoice.billing_month)}\n` +
      `---------------------------\n` +
      `• Billable Deliveries: ${invoice.billable_days} days @ ₹${invoice.daily_rate}/day = ₹${invoice.current_charges}\n` +
      `• Absences / Holidays: ${invoice.absence_days} days\n` +
      `• Previous Balance: ₹${invoice.opening_balance}\n` +
      `• Total Payable: ₹${invoice.total_payable}\n` +
      `• Amount Paid: ₹${invoice.amount_paid}\n` +
      `*Remaining Due: ₹${invoice.closing_balance}*\n` +
      `---------------------------\n` +
      `Please pay via UPI to: 9899001122@upi or Cash.\n` +
      `Thank you for subscribing with Lotus Flowers! 🙏`;
    
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${customer.phone}?text=${encoded}`, '_blank');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Flower Delivery Bill"
      description={`Invoice: ${invoice.invoice_number}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print Bill</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsAppShare}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              <span>Share WhatsApp</span>
            </Button>
          </div>

          {invoice.closing_balance > 0 && customer && onRecordPayment && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onClose();
                onRecordPayment(customer);
              }}
            >
              Collect Due ₹{invoice.closing_balance}
            </Button>
          )}
        </div>
      }
    >
      <div className="printable-area space-y-5 bg-white p-2">
        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b pb-4 border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Flower2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                LOTUS FLOWER SHOP
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fresh Daily Pooja Flowers & Doorstep Subscriptions
            </p>
            <p className="text-xs text-slate-500">Civil Lines Market, Ph: +91 98990 01122</p>
          </div>

          <div className="text-right">
            <InvoiceStatusBadge status={invoice.status} />
            <p className="text-xs font-mono font-bold text-slate-800 mt-1.5">
              {invoice.invoice_number}
            </p>
            <p className="text-[11px] text-slate-400">
              Date: {formatDate(invoice.created_at.split('T')[0])}
            </p>
            <p className="text-[11px] text-slate-400">Due: {formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Customer & Billing Period Info */}
        <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl text-xs">
          <div>
            <span className="font-semibold text-slate-400 uppercase text-[10px]">Billed To:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{customer?.name}</p>
            <p className="text-slate-600">{customer?.address}</p>
            <p className="text-slate-600">Mob: +91 {customer?.phone}</p>
          </div>
          <div className="text-right">
            <span className="font-semibold text-slate-400 uppercase text-[10px]">
              Billing Cycle:
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {formatMonthYear(invoice.billing_month)}
            </p>
            <p className="text-slate-600">Total Month Days: {invoice.total_calendar_days} Days</p>
            <p className="text-slate-600">Variety: {customer?.flower_type}</p>
          </div>
        </div>

        {/* Delivery Accounting Breakdown Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Service Particulars</th>
                <th className="py-2.5 px-3 text-center">Days</th>
                <th className="py-2.5 px-3 text-right">Daily Rate</th>
                <th className="py-2.5 px-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Confirmed Eligible Flower Deliveries
                  <span className="block text-[10px] text-emerald-600">
                    Delivered successfully to doorstep
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                  {invoice.billable_days}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatCurrency(invoice.daily_rate)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(invoice.current_charges)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-medium">
                  Planned Vacation & Approved Absence
                  <span className="block text-[10px] text-slate-400">
                    Customer leave dates excluded from billing
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                  {invoice.absence_days}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹0</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹0</td>
              </tr>

              {invoice.other_non_billable_days > 0 && (
                <tr>
                  <td className="py-2.5 px-3 font-medium">
                    Missed / Shop Non-delivery Days
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-500">
                    {invoice.other_non_billable_days}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹0</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹0</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Box (BRD Formula) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Current Month Charges ({invoice.billable_days} deliveries × ₹{invoice.daily_rate}):</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(invoice.current_charges)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Previous Carry-Forward Balance:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatCurrency(invoice.opening_balance)}
            </span>
          </div>

          {invoice.adjustments !== 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Adjustments / Credits:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(invoice.adjustments)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
            <span>Total Amount Payable:</span>
            <span className="font-mono text-base text-blue-700">
              {formatCurrency(invoice.total_payable)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600 pt-1">
            <span>Payments Received:</span>
            <span className="font-mono font-bold text-emerald-600">
              - {formatCurrency(invoice.amount_paid)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900 bg-white p-2.5 rounded-xl border">
            <span>Remaining Closing Balance:</span>
            <MoneyDisplay
              amount={invoice.closing_balance}
              highlightNegative
              size="lg"
            />
          </div>
        </div>

        {/* Payment QR / Bank Details Footer */}
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
          <div>
            <p className="font-bold">UPI ID: 9899001122@upi</p>
            <p className="text-slate-500">Google Pay / PhonePe / Paytm / Cash accepted</p>
          </div>
          <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
            Verified Bill
          </span>
        </div>
      </div>
    </Dialog>
  );
}
