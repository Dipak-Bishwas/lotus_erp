import React, { useState, useMemo } from 'react';
import { Customer, DailyDelivery } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StorageService } from '@/lib/storage';
import { formatCurrency } from '@/lib/formatters';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
  HelpCircle,
  Flower2
} from 'lucide-react';

interface CustomerAttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerAttendanceCalendarModal({
  isOpen,
  onClose,
  customer,
}: CustomerAttendanceCalendarModalProps) {
  if (!customer) return null;

  // Initialize with current date's year & month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12

  // Format month string YYYY-MM
  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Compute attendance map for this month
  const { days, stats } = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sunday

    // Fetch deliveries and absences from storage
    const allDeliveries = StorageService.getDeliveries().filter(
      (d) => d.customer_id === customer.customer_id && d.delivery_date.startsWith(monthStr)
    );
    const absences = StorageService.getAbsences().filter(
      (a) => a.customer_id === customer.customer_id && a.status === 'APPROVED'
    );

    let presentCount = 0;
    let absentCount = 0;
    let futureCount = 0;

    const calendarDays = [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${monthStr}-${dayPad}`;

      // Check service period bounds
      const isBeforeStart = customer.start_date && dateStr < customer.start_date;
      const isAfterEnd = customer.end_date && dateStr > customer.end_date;

      if (isBeforeStart || isAfterEnd) {
        calendarDays.push({
          day,
          dateStr,
          status: 'NOT_STARTED' as const,
          isToday: dateStr === todayStr,
        });
        continue;
      }

      // Check if marked absent in deliveries or vacation
      const delivery = allDeliveries.find((d) => d.delivery_date === dateStr);
      const absenceRecord = absences.find((a) => dateStr >= a.start_date && dateStr <= a.end_date);

      if (
        (delivery && (delivery.status === 'CUSTOMER_ABSENT' || delivery.status === 'NOT_DELIVERED' || delivery.status === 'VACATION')) ||
        absenceRecord
      ) {
        absentCount++;
        const reason = delivery?.absent_reason || delivery?.notes || absenceRecord?.reason || 'Customer Absent';
        calendarDays.push({
          day,
          dateStr,
          status: 'ABSENT' as const,
          reason,
          isToday: dateStr === todayStr,
        });
      } else if (dateStr > todayStr) {
        futureCount++;
        calendarDays.push({
          day,
          dateStr,
          status: 'FUTURE' as const,
          isToday: dateStr === todayStr,
        });
      } else {
        // Auto-present model: delivered
        presentCount++;
        calendarDays.push({
          day,
          dateStr,
          status: 'PRESENT' as const,
          isToday: dateStr === todayStr,
        });
      }
    }

    return {
      days: calendarDays,
      firstDayOfWeek,
      stats: {
        presentCount,
        absentCount,
        futureCount,
        totalCalendarDays: totalDaysInMonth,
      },
    };
  }, [customer, monthStr, currentYear, currentMonth, todayStr]);

  const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance & Delivery Calendar"
      description={`Viewing daily record for ${customer.name}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Flower2 className="w-4 h-4 text-rose-500" />
            <span>Daily Rate: <strong className="text-slate-800">{formatCurrency(customer.current_rate)}</strong>/day</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Month Selector & Navigation */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 px-2.5 text-xs text-slate-700 hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            <span>Prev</span>
          </Button>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 px-2.5 text-xs text-slate-700 hover:bg-white"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>

        {/* Quick Summary Badges */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Present</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {stats.presentCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Days Delivered</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Absent</span>
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {stats.absentCount}
            </div>
            <span className="text-[10px] text-rose-600 font-medium">Days Deducted</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold text-xs uppercase tracking-wider">
              <CalendarIcon className="w-4 h-4 text-slate-500" />
              <span>Total Days</span>
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {stats.totalCalendarDays}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Month Total</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-600">
            {weekHeaders.map((header) => (
              <div key={header} className="text-slate-500">
                {header}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 p-2 bg-slate-50/50">
            {/* Blank cells for offset */}
            {Array.from({ length: new Date(currentYear, currentMonth - 1, 1).getDay() }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-14 sm:h-16 rounded-xl bg-transparent" />
            ))}

            {/* Actual Month Days */}
            {days.map((item) => {
              const isPresent = item.status === 'PRESENT';
              const isAbsent = item.status === 'ABSENT';
              const isFuture = item.status === 'FUTURE';
              const isNotStarted = item.status === 'NOT_STARTED';

              let cellStyle = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300';
              let badgeStyle = '';
              let statusLabel = '';

              if (isPresent) {
                cellStyle = 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100/90';
                badgeStyle = 'bg-emerald-500 text-white font-bold';
                statusLabel = 'Present';
              } else if (isAbsent) {
                cellStyle = 'bg-rose-50/90 border-rose-300 text-rose-950 hover:bg-rose-100/90 shadow-2xs';
                badgeStyle = 'bg-rose-600 text-white font-bold';
                statusLabel = 'Absent';
              } else if (isNotStarted) {
                cellStyle = 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 opacity-50';
              } else if (isFuture) {
                cellStyle = 'bg-slate-50/40 border-slate-200/80 text-slate-400';
              }

              return (
                <div
                  key={item.dateStr}
                  className={`h-14 sm:h-16 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all relative ${cellStyle} ${
                    item.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-black ${
                      item.isToday ? 'text-blue-600 underline decoration-2' : ''
                    }`}>
                      {item.day}
                    </span>
                    {item.isToday && (
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-blue-600 text-white rounded">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-center min-h-[20px]">
                    {statusLabel ? (
                      <span
                        className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md w-full text-center truncate ${badgeStyle}`}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block shadow-xs" />
            <span className="font-semibold text-emerald-900">Green = Present (Delivered)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block shadow-xs" />
            <span className="font-semibold text-rose-900">Red = Absent (Deducted ₹0)</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
