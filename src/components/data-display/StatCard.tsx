import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  badge?: ReactNode;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  subtitle,
  className,
  badge,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between transition-all duration-150',
        onClick && 'cursor-pointer hover:border-blue-400 hover:shadow-card tap-highlight',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {label}
        </span>
        {icon && (
          <div className="p-2 bg-slate-50 text-slate-700 rounded-xl border border-slate-100 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {badge}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-xs">
          {trend && (
            <span
              className={cn(
                'font-bold inline-flex items-center',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
