export type UserRole = 'ADMIN' | 'DELIVERY_BOY';

export interface User {
  user_id: string;
  name: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  assigned_area_ids?: string[];
  avatar_url?: string;
  password?: string;
  joining_date?: string;
}

export interface DeliveryArea {
  area_id: string;
  area_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  assigned_delivery_boy_id?: string;
  customer_count?: number;
}

export type CustomerStatus = 'ACTIVE' | 'PAUSED' | 'INACTIVE';

export interface CustomerRateHistory {
  rate_id: string;
  customer_id: string;
  flower_type: string;
  daily_price: number; // e.g. 5, 10, 20 or custom
  effective_from: string; // YYYY-MM-DD
  effective_to?: string; // YYYY-MM-DD or null
}

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  address: string;
  area_id: string;
  assigned_delivery_boy_id: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  status: CustomerStatus;
  current_rate: number; // Current active daily price
  flower_type: string;
  instructions?: string;
  opening_balance: number; // Prior carry-forward amount
  current_outstanding: number;
}

export type DeliveryStatus = 
  | 'DELIVERED' 
  | 'CUSTOMER_ABSENT' 
  | 'VACATION' 
  | 'NOT_DELIVERED' 
  | 'PENDING';

export interface DailyDelivery {
  delivery_id: string;
  customer_id: string;
  delivery_date: string; // YYYY-MM-DD
  delivery_boy_id: string;
  status: DeliveryStatus;
  billable_amount: number; // calculated snapshot based on rate on that date if delivered
  updated_by: string; // user_id
  updated_at: string;
  notes?: string;
}

export type AbsenceStatus = 'APPROVED' | 'PENDING' | 'CANCELLED';

export interface Absence {
  absence_id: string;
  customer_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_days: number;
  reason: string;
  status: AbsenceStatus;
  created_by: string;
  created_at: string;
}

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'FINALIZED' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'OVERDUE' 
  | 'CANCELLED';

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  billing_month: string; // YYYY-MM (e.g. 2026-10)
  total_calendar_days: number;
  billable_days: number;
  absence_days: number;
  other_non_billable_days: number;
  daily_rate: number;
  current_charges: number; // e.g. 24 x 10 = 240
  opening_balance: number; // previous carry-forward, e.g. 50
  adjustments: number; // credits or adjustments
  total_payable: number; // current_charges + opening_balance + adjustments = 290
  amount_paid: number; // e.g. 200
  closing_balance: number; // total_payable - amount_paid = 90
  status: InvoiceStatus;
  created_at: string;
  finalized_at?: string;
  due_date: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface Payment {
  payment_id: string;
  receipt_number: string;
  customer_id: string;
  payment_date: string; // YYYY-MM-DD
  amount: number;
  payment_method: PaymentMethod;
  reference?: string; // UPI ref or txn number
  notes?: string;
  recorded_by: string;
  recorded_by_name: string;
  status: 'COMPLETED' | 'REVERSED';
  reversal_reason?: string;
  reversed_at?: string;
}

export interface PaymentAllocation {
  allocation_id: string;
  payment_id: string;
  invoice_id: string;
  allocated_amount: number;
}

export interface LedgerEntry {
  entry_id: string;
  customer_id: string;
  date: string;
  description: string;
  reference?: string;
  debit: number; // Increases receivable (charges, opening balance)
  credit: number; // Decreases receivable (payments, adjustments)
  running_balance: number;
  type: 'OPENING_BALANCE' | 'INVOICE' | 'PAYMENT' | 'ADJUSTMENT';
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: 'CUSTOMER' | 'DELIVERY' | 'ABSENCE' | 'INVOICE' | 'PAYMENT' | 'RATE';
  entity_id: string;
  timestamp: string;
  change_summary: string;
}
