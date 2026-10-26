import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Customer, DailyDelivery } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  CalendarOff,
  MapPin,
  Flower2,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Phone
} from 'lucide-react';

export interface MarkAbsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  delivery?: DailyDelivery | null;
  date: string;
  onConfirmAbsent: (reason: string, notes?: string) => void;
}

const COMMON_REASONS = [
  {
    id: 'REFUSED',
    label: 'Customer Refused / Said Not Needed Today',
    sublabel: 'ग्राहक ने आज मना किया',
    badge: 'Customer Request'
  },
  {
    id: 'DOOR_LOCKED',
    label: 'Door Locked / House Closed',
    sublabel: 'घर बंद था / कोई नहीं था',
    badge: 'No Access'
  },
  {
    id: 'MISSED',
    label: 'Delivery Missed / Forgot by Delivery Boy',
    sublabel: 'छूट गया / भूल गए',
    badge: 'Driver Missed'
  },
  {
    id: 'FLOWERS_FINISHED',
    label: 'Flowers Out of Stock / Damaged',
    sublabel: 'फूल खत्म हो गए या खराब थे',
    badge: 'Inventory'
  },
  {
    id: 'OTHER',
    label: 'Other Reason (Specify below)',
    sublabel: 'अन्य कारण',
    badge: 'Custom'
  }
];

export function MarkAbsentModal({
  isOpen,
  onClose,
  customer,
  delivery,
  date,
  onConfirmAbsent,
}: MarkAbsentModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    delivery?.absent_reason || COMMON_REASONS[0].label
  );
  const [notes, setNotes] = useState<string>(delivery?.notes || '');
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (delivery?.absent_reason) {
      const match = COMMON_REASONS.find(r => r.label === delivery.absent_reason);
      if (match) {
        setSelectedReason(match.label);
      } else {
        setSelectedReason(COMMON_REASONS[4].label);
        setCustomReason(delivery.absent_reason);
      }
    } else {
      setSelectedReason(COMMON_REASONS[0].label);
      setCustomReason('');
    }
    setNotes(delivery?.notes || '');
  }, [delivery, isOpen]);

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason.startsWith('Other') 
      ? (customReason.trim() || 'Other reason')
      : selectedReason;

    onConfirmAbsent(finalReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Customer Absent for Today"
      description="Record reason for skipping delivery. This day will be excluded from the customer's monthly bill."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Customer Information Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base">{customer.name}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {customer.customer_id}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-medium">{customer.address}</span>
              </div>
            </div>

            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Flower2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-bold text-slate-800">{customer.flower_type}</span>
            </div>
            <div className="font-semibold text-slate-700">
              Daily Price: <strong className="text-slate-900 font-mono">{formatCurrency(customer.current_rate)}</strong>
            </div>
          </div>
        </div>

        {/* Date Display */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-blue-50/60 rounded-xl border border-blue-200/70 text-xs">
          <span className="font-semibold text-blue-900">Absent Date:</span>
          <span className="font-black text-blue-800 font-mono">{formatDate(date)}</span>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            Select Reason (कारण चुनें) <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-2">
            {COMMON_REASONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedReason(r.label)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all tap-highlight flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-xs">{r.label}</p>
                    <p className="text-[11px] text-slate-500">{r.sublabel}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                      isSelected
                        ? 'bg-amber-200/80 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedReason.startsWith('Other') && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Type custom reason here (e.g. Festival, Out of town)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Additional Note (Optional) */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Driver Note / Special Remark (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Customer called at 6:15 AM to skip"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Clear Billing Transparency Notice */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="flex items-center gap-1.5 font-black text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automatic ₹0 Billing Protection</span>
          </div>
          <p className="text-[11px] text-emerald-800">
            Marking this absent ensures <strong>₹0 charge</strong> is added to this customer's monthly bill.
            All other customers on your route remain automatically marked as <strong>Delivered (Present)</strong>.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 font-bold"
          >
            Confirm Absent (₹0 Bill)
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
