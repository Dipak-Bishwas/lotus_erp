import React from 'react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function MoneyDisplay({
  amount,
  className,
  highlightPositive = false,
  highlightNegative = false,
  size = 'md',
}: {
  amount: number | null | undefined;
  className?: string;
  highlightPositive?: boolean;
  highlightNegative?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const val = amount || 0;
  const isPositive = val > 0;

  const sizes = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-lg font-extrabold',
    xl: 'text-2xl font-black',
  };

  return (
    <span
      className={cn(
        'font-mono tracking-tight inline-block',
        sizes[size],
        highlightPositive && isPositive && 'text-emerald-600',
        highlightNegative && isPositive && 'text-rose-600',
        !highlightPositive && !highlightNegative && 'text-slate-900',
        className
      )}
    >
      {formatCurrency(val)}
    </span>
  );
}

export function DateDisplay({
  date,
  className,
  showTime = false,
}: {
  date: string | null | undefined;
  className?: string;
  showTime?: boolean;
}) {
  return (
    <span className={cn('text-slate-700 font-medium inline-block', className)}>
      {formatDate(date)}
      {showTime && date && date.includes('T') && (
        <span className="text-slate-400 text-xs ml-1.5">
          {new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </span>
  );
}
