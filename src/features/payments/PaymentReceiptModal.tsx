import React from 'react';
import { Payment, Customer } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { StorageService } from '@/lib/storage';
import {
  Printer,
  Share2,
  CheckCircle2,
  Flower2,
  ShieldCheck,
  Receipt
} from 'lucide-react';

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}) {
  if (!payment) return null;

  const customer = StorageService.getCustomer(payment.customer_id);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!customer) return;
    const msg = `🧾 *LOTUS FLOWER SHOP - PAYMENT RECEIPT* 🧾\n` +
      `Receipt No: ${payment.receipt_number}\n` +
      `Received From: ${customer.name}\n` +
      `Date: ${formatDate(payment.payment_date)}\n` +
      `Amount Paid: ₹${payment.amount}\n` +
      `Payment Mode: ${payment.payment_method}\n` +
      `${payment.reference ? `Ref/Txn ID: ${payment.reference}\n` : ''}` +
      `Updated Balance Due: ₹${customer.current_outstanding}\n` +
      `---------------------------\n` +
      `Thank you for your payment! 🙏\n` +
      `Lotus Flower Shop & Pooja Services`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/91${customer.phone}?text=${encoded}`, '_blank');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      description={`Receipt: ${payment.receipt_number}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print Receipt</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            <span>WhatsApp Receipt</span>
          </Button>
        </div>
      }
    >
      <div className="printable-area space-y-4 bg-white p-2">
        {/* Receipt Header */}
        <div className="text-center border-b pb-3 border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">PAYMENT ACKNOWLEDGEMENT</h3>
          <p className="text-xs text-slate-500">Lotus Flower Shop • Civil Lines, Delhi</p>
          <span className="inline-block mt-2 font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
            {payment.receipt_number}
          </span>
        </div>

        {/* Amount Box */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Amount Received
          </span>
          <div className="text-3xl font-black text-emerald-700 font-mono">
            {formatCurrency(payment.amount)}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Payment Status: {payment.status}
          </span>
        </div>

        {/* Breakdown Details */}
        <div className="space-y-2 text-xs divide-y divide-slate-100">
          <div className="flex justify-between py-1.5 text-slate-600">
            <span>Customer Name:</span>
            <strong className="text-slate-900">{customer?.name}</strong>
          </div>
          <div className="flex justify-between py-1.5 text-slate-600">
            <span>Payment Date:</span>
            <span className="font-medium text-slate-800">{formatDate(payment.payment_date)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-slate-600">
            <span>Payment Method:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {payment.payment_method}
            </span>
          </div>
          {payment.reference && (
            <div className="flex justify-between py-1.5 text-slate-600">
              <span>Transaction Reference:</span>
              <span className="font-mono text-slate-800">{payment.reference}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 text-slate-600">
            <span>Recorded By:</span>
            <span className="text-slate-700">{payment.recorded_by_name}</span>
          </div>
          {payment.notes && (
            <div className="flex justify-between py-1.5 text-slate-600">
              <span>Notes:</span>
              <span className="text-slate-700 italic">{payment.notes}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-slate-900 font-bold bg-slate-50 px-2.5 rounded-lg border">
            <span>Remaining Account Balance:</span>
            <MoneyDisplay
              amount={customer?.current_outstanding || 0}
              highlightNegative
              size="md"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
