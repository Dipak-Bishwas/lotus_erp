import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { MoneyDisplay } from '@/components/data-display/MoneyDisplay';
import { formatCurrency, formatDate, getCurrentMonthString } from '@/lib/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  Truck,
  Users,
  CreditCard,
  CalendarOff,
  MapPin,
  TrendingUp
} from 'lucide-react';

export function ReportsView() {
  const [reportType, setReportType] = useState<
    'BILLING' | 'OUTSTANDING' | 'COLLECTIONS' | 'STAFF' | 'AREAS' | 'ABSENCES'
  >('BILLING');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());

  const customers = StorageService.getCustomers();
  const invoices = StorageService.getInvoices();
  const payments = StorageService.getPayments();
  const deliveries = StorageService.getDeliveries();
  const deliveryBoys = StorageService.getDeliveryBoys();
  const areas = StorageService.getAreas();
  const absences = StorageService.getAbsences();

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'BILLING') {
      csvContent += 'InvoiceNumber,Customer,BillingMonth,BillableDays,Rate,Charges,OpeningBalance,TotalPayable,AmountPaid,ClosingBalance,Status\n';
      invoices.forEach((i) => {
        const c = customers.find((cust) => cust.customer_id === i.customer_id);
        csvContent += `"${i.invoice_number}","${c?.name || i.customer_id}","${i.billing_month}",${i.billable_days},${i.daily_rate},${i.current_charges},${i.opening_balance},${i.total_payable},${i.amount_paid},${i.closing_balance},"${i.status}"\n`;
      });
    } else if (reportType === 'OUTSTANDING') {
      csvContent += 'CustomerID,Name,Phone,Address,FlowerType,DailyRate,OutstandingBalance,Status\n';
      customers
        .filter((c) => c.current_outstanding > 0)
        .forEach((c) => {
          csvContent += `"${c.customer_id}","${c.name}","${c.phone}","${c.address}","${c.flower_type}",${c.current_rate},${c.current_outstanding},"${c.status}"\n`;
        });
    } else if (reportType === 'COLLECTIONS') {
      csvContent += 'ReceiptNumber,Customer,Date,Amount,PaymentMethod,Reference,Status\n';
      payments.forEach((p) => {
        const c = customers.find((cust) => cust.customer_id === p.customer_id);
        csvContent += `"${p.receipt_number}","${c?.name || p.customer_id}","${p.payment_date}",${p.amount},"${p.payment_method}","${p.reference || ''}","${p.status}"\n`;
      });
    } else {
      csvContent += 'ID,Name,Details,Count\n';
      customers.forEach((c) => {
        csvContent += `"${c.customer_id}","${c.name}","${c.address}",${c.current_outstanding}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lotus_erp_report_${reportType.toLowerCase()}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports & Financial Analytics</h2>
          <p className="text-xs text-slate-500">
            Export reconciled monthly charges, customer balances, and staff delivery performance
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={handleExportCSV} className="font-semibold">
          <Download className="w-4 h-4 mr-1.5" />
          <span>Export to CSV</span>
        </Button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
        <button
          onClick={() => setReportType('BILLING')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all tap-highlight ${
            reportType === 'BILLING'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Billing
        </button>
        <button
          onClick={() => setReportType('OUTSTANDING')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all tap-highlight ${
            reportType === 'OUTSTANDING'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Outstanding Balances
        </button>
        <button
          onClick={() => setReportType('COLLECTIONS')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all tap-highlight ${
            reportType === 'COLLECTIONS'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Payment Collections
        </button>
        <button
          onClick={() => setReportType('STAFF')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all tap-highlight ${
            reportType === 'STAFF'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Staff Performance
        </button>
        <button
          onClick={() => setReportType('AREAS')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all tap-highlight ${
            reportType === 'AREAS'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Area Summary
        </button>
      </div>

      {/* Report Content Tables */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        {reportType === 'BILLING' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Billable Days</th>
                <th className="py-3 px-4 text-right">Charges</th>
                <th className="py-3 px-4 text-right">Previous Balance</th>
                <th className="py-3 px-4 text-right">Total Payable</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Remaining Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => {
                const c = customers.find((cust) => cust.customer_id === inv.customer_id);
                return (
                  <tr key={inv.invoice_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{c?.name || inv.customer_id}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {inv.billable_days}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.current_charges)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatCurrency(inv.opening_balance)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {formatCurrency(inv.total_payable)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">
                      {formatCurrency(inv.amount_paid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      <MoneyDisplay
                        amount={inv.closing_balance}
                        highlightNegative
                        size="sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {reportType === 'OUTSTANDING' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Daily Rate</th>
                <th className="py-3 px-4 text-right">Outstanding Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customers
                .filter((c) => c.current_outstanding > 0)
                .map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-blue-600">{c.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{c.address}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {formatCurrency(c.current_rate)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <MoneyDisplay
                        amount={c.current_outstanding}
                        highlightNegative
                        size="md"
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {reportType === 'COLLECTIONS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Collected Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payments
                .filter((p) => p.status === 'COMPLETED')
                .map((p) => {
                  const c = customers.find((cust) => cust.customer_id === p.customer_id);
                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.receipt_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{c?.name || p.customer_id}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.payment_method}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.reference || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}

        {reportType === 'STAFF' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Delivery Staff</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Assigned Clients</th>
                <th className="py-3 px-4 text-center">Today Completed</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deliveryBoys.map((boy) => {
                const assigned = customers.filter((c) => c.assigned_delivery_boy_id === boy.user_id);
                const boyDels = deliveries.filter((d) => d.delivery_boy_id === boy.user_id);
                const boyDone = boyDels.filter((d) => d.status === 'DELIVERED');
                return (
                  <tr key={boy.user_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{boy.name}</td>
                    <td className="py-3 px-4 text-blue-600">{boy.phone}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700 font-mono">
                      {assigned.length} Homes
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                      {boyDone.length}/{boyDels.length}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {boy.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {reportType === 'AREAS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Area Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Total Customers</th>
                <th className="py-3 px-4 text-right">Outstanding Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {areas.map((a) => {
                const areaCusts = customers.filter((c) => c.area_id === a.area_id);
                const totalAreaDue = areaCusts.reduce((sum, c) => sum + c.current_outstanding, 0);
                return (
                  <tr key={a.area_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.area_name}</td>
                    <td className="py-3 px-4 text-slate-500">{a.description}</td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">
                      {areaCusts.length}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(totalAreaDue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
