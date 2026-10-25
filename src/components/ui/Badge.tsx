import React from 'react';
import { cn } from '@/lib/utils';
import { DeliveryStatus, InvoiceStatus, CustomerStatus } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Calendar, PauseCircle, ShieldCheck } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border-blue-200/80',
    secondary: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border leading-none tracking-tight select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  switch (status) {
    case 'DELIVERED':
      return (
        <Badge variant="success">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Delivered
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </Badge>
      );
    case 'CUSTOMER_ABSENT':
      return (
        <Badge variant="default">
          <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
          Customer Absent
        </Badge>
      );
    case 'VACATION':
      return (
        <Badge variant="info">
          <Calendar className="w-3.5 h-3.5" />
          Vacation Leave
        </Badge>
      );
    case 'NOT_DELIVERED':
      return (
        <Badge variant="danger">
          <XCircle className="w-3.5 h-3.5" />
          Not Delivered
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  switch (status) {
    case 'PAID':
      return (
        <Badge variant="success">
          <ShieldCheck className="w-3.5 h-3.5" />
          Paid
        </Badge>
      );
    case 'PARTIALLY_PAID':
      return (
        <Badge variant="warning">
          <Clock className="w-3.5 h-3.5" />
          Partially Paid
        </Badge>
      );
    case 'FINALIZED':
      return (
        <Badge variant="info">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Finalized
        </Badge>
      );
    case 'DRAFT':
      return <Badge variant="default">Draft</Badge>;
    case 'OVERDUE':
      return (
        <Badge variant="danger">
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue
        </Badge>
      );
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'PAUSED':
      return <Badge variant="warning">Paused</Badge>;
    case 'INACTIVE':
      return <Badge variant="danger">Inactive</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
