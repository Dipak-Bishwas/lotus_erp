import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { StorageService } from '@/lib/storage';
import { useToast } from '@/components/feedback/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { InlineAlert } from '@/components/feedback/InlineAlert';
import { generateId } from '@/lib/utils';
import { formatDate, getInclusiveDays, getTodayDateString } from '@/lib/formatters';
import { Absence, Customer } from '@/types';
import {
  CalendarOff,
  Plus,
  Calendar,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export function AbsenceManagementView({
  initialCustomerId,
}: {
  initialCustomerId?: string;
}) {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [leaveType, setLeaveType] = useState<'RANGE' | 'SINGLE'>('RANGE');
  const [singleDate, setSingleDate] = useState(getTodayDateString());
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [reason, setReason] = useState('Family traveling out of city');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
      setIsModalOpen(true);
    }
  }, [initialCustomerId]);

  const loadData = () => {
    const abs = StorageService.getAbsences();
    const custs = StorageService.getCustomers();
    setAbsences(abs);
    setCustomers(custs);
    if (!selectedCustomerId && custs.length > 0) {
      setSelectedCustomerId(custs[0].customer_id);
    }
  };

  const getCustomer = (customerId: string) => {
    return customers.find((c) => c.customer_id === customerId);
  };

  const handleOpenAdd = () => {
    setSelectedCustomerId(customers[0]?.customer_id || '');
    setLeaveType('RANGE');
    setStartDate(getTodayDateString());
    setEndDate(getTodayDateString());
    setReason('Family traveling out of city');
    setError('');
    setIsModalOpen(true);
  };

  const handleCreateAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason for the leave');
      return;
    }

    const actualStart = leaveType === 'SINGLE' ? singleDate : startDate;
    const actualEnd = leaveType === 'SINGLE' ? singleDate : endDate;

    if (new Date(actualStart).getTime() > new Date(actualEnd).getTime()) {
      setError('Start date cannot be after end date');
      return;
    }

    const totalDays = getInclusiveDays(actualStart, actualEnd);

    const newAbsence: Absence = {
      absence_id: generateId('ABS'),
      customer_id: selectedCustomerId,
      start_date: actualStart,
      end_date: actualEnd,
      total_days: totalDays,
      reason: reason.trim(),
      status: 'APPROVED',
      created_by: currentUser.user_id,
      created_at: new Date().toISOString(),
    };

    const result = StorageService.saveAbsence(newAbsence, currentUser);
    if (!result.success) {
      setError(result.message || 'Failed to save absence.');
      return;
    }

    showToast(
      'Leave Recorded',
      `${totalDays} days leave saved for ${getCustomer(selectedCustomerId)?.name}`,
      'success'
    );
    setIsModalOpen(false);
    loadData();
  };

  const handleCancelAbsence = (absenceId: string) => {
    if (window.confirm('Cancel this recorded absence? Affected dates will become regular delivery days.')) {
      StorageService.cancelAbsence(absenceId, currentUser);
      showToast('Leave Cancelled', 'Absence record marked as cancelled', 'info');
      loadData();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Absence & Planned Vacation</h2>
          <p className="text-xs text-slate-500">
            Pause daily deliveries and automatically exclude vacation dates from monthly billing
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" variant="primary" onClick={handleOpenAdd} className="font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Record Absence / Vacation</span>
          </Button>
        )}
      </div>

      {/* BRD Rules Summary Banner */}
      <InlineAlert variant="info" title="Billing Exclusion Guarantee (BRD FR-06 & BR-05)">
        Approved absence days (such as a 5-day vacation from 10 to 14 Nov) are strictly non-billable. Overlapping absences are automatically validated to prevent duplicate deductions.
      </InlineAlert>

      {/* Absence Cards / List */}
      {absences.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="w-8 h-8 text-purple-400" />}
          title="No Leaves Recorded"
          description="Record upcoming vacations or single-day leaves for customers."
          actionLabel="Record Leave"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="space-y-3">
          {absences.map((abs) => {
            const cust = getCustomer(abs.customer_id);
            const isApproved = abs.status === 'APPROVED';

            return (
              <div
                key={abs.absence_id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isApproved ? 'border-slate-200/90' : 'border-slate-200/50 opacity-60 bg-slate-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-slate-900">
                      {cust?.name || abs.customer_id}
                    </span>
                    <Badge variant={isApproved ? 'info' : 'default'} size="sm">
                      {abs.total_days} {abs.total_days === 1 ? 'Day' : 'Days'} Leave
                    </Badge>
                    <Badge variant={isApproved ? 'success' : 'danger'} size="sm">
                      {abs.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Reason: <span className="text-slate-800">{abs.reason}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        {formatDate(abs.start_date)}
                        {abs.start_date !== abs.end_date && ` to ${formatDate(abs.end_date)}`}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">Excluded from Bill</span>
                  </div>
                </div>

                {isAdmin && isApproved && (
                  <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelAbsence(abs.absence_id)}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Cancel Leave</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Absence Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Absence or Vacation"
        description="Select single date or multi-day vacation range"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateAbsence}>
              Approve & Save Leave
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAbsence} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
              {error}
            </div>
          )}

          <Select
            label="Customer"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            required
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.name} — {c.address}
              </option>
            ))}
          </Select>

          {/* Toggle Single Date vs Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Leave Duration Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLeaveType('RANGE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all tap-highlight ${
                  leaveType === 'RANGE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Date Range (Multi-day)
              </button>
              <button
                type="button"
                onClick={() => setLeaveType('SINGLE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all tap-highlight ${
                  leaveType === 'SINGLE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Single Day Absence
              </button>
            </div>
          </div>

          {leaveType === 'SINGLE' ? (
            <Input
              label="Absence Date"
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              required
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          )}

          {leaveType === 'RANGE' && startDate && endDate && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
              <span>Total Vacation Calendar Days:</span>
              <strong className="font-extrabold text-sm">
                {getInclusiveDays(startDate, endDate)} Days
              </strong>
            </div>
          )}

          <Input
            label="Reason / Notes"
            placeholder="e.g. Family travelling, Out of station, House locked..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </form>
      </Dialog>
    </div>
  );
}
