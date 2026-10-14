// ==============================================================================
// Financial Analytics & KPI Aggregation Engine
// ==============================================================================

import { Invoice, DashboardMetrics, PaymentStatus } from '@/types/database';
import { roundCurrency } from '@/lib/calculations/gst';

export interface DateFilterOptions {
  startDate?: string;
  endDate?: string;
  invoiceType?: 'all' | 'sales' | 'purchase';
  status?: string;
}

/**
 * Filter invoices based on date range and optional criteria
 */
export function filterInvoices(invoices: Invoice[], filters: DateFilterOptions = {}): Invoice[] {
  return invoices.filter((inv) => {
    if (filters.startDate && inv.invoice_date < filters.startDate) return false;
    if (filters.endDate && inv.invoice_date > filters.endDate) return false;
    if (filters.invoiceType && filters.invoiceType !== 'all' && inv.invoice_type !== filters.invoiceType) return false;
    if (filters.status && filters.status !== 'all' && inv.payment_status !== filters.status) return false;
    return true;
  });
}

/**
 * Compute authoritative dashboard and analytics metrics from invoice records
 */
export function computeDashboardMetrics(invoices: Invoice[], referenceDate?: string): DashboardMetrics {
  let totalSales = 0;
  let totalPurchases = 0;
  let totalTaxableSales = 0;
  let totalSalesGst = 0;
  let totalInputGst = 0;
  let outstandingReceivables = 0;
  let outstandingPayables = 0;
  let overdueInvoicesCount = 0;
  let overdueAmount = 0;
  let totalSalesPaid = 0;

  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  const paymentStatusCounts: Record<PaymentStatus, number> = {
    draft: 0,
    unpaid: 0,
    partially_paid: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
  };

  const monthlyMap = new Map<string, { sales: number; purchases: number; gstCollected: number; inputGst: number }>();

  // Use provided reference date or static fallback date for prerendering
  const todayStr = referenceDate || '2025-03-31';

  for (const inv of invoices) {
    const isCancelled = inv.payment_status === 'cancelled';
    const isDraft = inv.payment_status === 'draft';
    const total = inv.total_amount || 0;
    const paid = inv.amount_paid || 0;
    const unpaid = Math.max(0, total - paid);

    // Track status count
    const status = inv.payment_status as PaymentStatus;
    if (paymentStatusCounts[status] !== undefined) {
      paymentStatusCounts[status]++;
    }

    // Exclude cancelled and drafts from finalized revenue/expense metrics
    if (!isCancelled && !isDraft) {
      const monthKey = (inv.invoice_date || '').substring(0, 7); // YYYY-MM
      const curMonth = monthlyMap.get(monthKey) || { sales: 0, purchases: 0, gstCollected: 0, inputGst: 0 };

      if (inv.invoice_type === 'sales') {
        totalSales = roundCurrency(totalSales + total);
        totalTaxableSales = roundCurrency(totalTaxableSales + (inv.taxable_amount || 0));
        const salesTax = (inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0) + (inv.cess_amount || 0);
        totalSalesGst = roundCurrency(totalSalesGst + salesTax);
        totalSalesPaid = roundCurrency(totalSalesPaid + paid);

        curMonth.sales = roundCurrency(curMonth.sales + total);
        curMonth.gstCollected = roundCurrency(curMonth.gstCollected + salesTax);

        if (unpaid > 0) {
          outstandingReceivables = roundCurrency(outstandingReceivables + unpaid);
        }
      } else if (inv.invoice_type === 'purchase') {
        totalPurchases = roundCurrency(totalPurchases + total);
        const purchaseTax = (inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0) + (inv.cess_amount || 0);
        totalInputGst = roundCurrency(totalInputGst + purchaseTax);

        curMonth.purchases = roundCurrency(curMonth.purchases + total);
        curMonth.inputGst = roundCurrency(curMonth.inputGst + purchaseTax);

        if (unpaid > 0) {
          outstandingPayables = roundCurrency(outstandingPayables + unpaid);
        }
      }

      totalCgst = roundCurrency(totalCgst + (inv.cgst_amount || 0));
      totalSgst = roundCurrency(totalSgst + (inv.sgst_amount || 0));
      totalIgst = roundCurrency(totalIgst + (inv.igst_amount || 0));
      totalCess = roundCurrency(totalCess + (inv.cess_amount || 0));

      if (inv.due_date && inv.due_date < todayStr && unpaid > 0) {
        overdueInvoicesCount++;
        overdueAmount = roundCurrency(overdueAmount + unpaid);
      }

      monthlyMap.set(monthKey, curMonth);
    }
  }

  // Build sorted monthly trends
  const monthlyTrends = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ...data,
    }));

  const finalizedSalesCount = invoices.filter((i) => i.invoice_type === 'sales' && i.payment_status !== 'cancelled' && i.payment_status !== 'draft').length;
  const collectionRate = totalSales > 0 ? Number(((totalSalesPaid / totalSales) * 100).toFixed(1)) : 0;
  const averageInvoiceValue = finalizedSalesCount > 0 ? Math.round(totalSales / finalizedSalesCount) : 0;

  return {
    totalSales,
    totalPurchases,
    totalTaxableSales,
    totalSalesGst,
    totalInputGst,
    outstandingReceivables,
    outstandingPayables,
    overdueInvoicesCount,
    overdueAmount,
    totalInvoicesCount: invoices.length,
    collectionRate,
    averageInvoiceValue,
    monthlyTrends,
    gstBreakdown: {
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      cess: totalCess,
    },
    paymentStatusCounts,
  };
}
