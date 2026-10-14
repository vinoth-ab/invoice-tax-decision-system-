// ==============================================================================
// Reports & CSV Export Utilities
// Generates standard Indian compliant financial report spreadsheets & CSVs
// ==============================================================================

import { Invoice, AnomalyAlert } from '@/types/database';
import { formatIndianDate } from '@/lib/calculations/currency';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generate CSV for Invoice Register
 */
export function exportInvoicesToCsv(invoices: Invoice[]): string {
  const headers = [
    'Invoice Number',
    'Type',
    'Date',
    'Due Date',
    'Party Name',
    'GSTIN',
    'Place of Supply',
    'Taxable Amount (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Cess (INR)',
    'Total Amount (INR)',
    'Amount Paid (INR)',
    'Balance Due (INR)',
    'Payment Status',
    'Is Sample'
  ];

  const rows = invoices.map((inv) => {
    const balance = Math.max(0, (inv.total_amount || 0) - (inv.amount_paid || 0));
    return [
      inv.invoice_number,
      inv.invoice_type.toUpperCase(),
      formatIndianDate(inv.invoice_date),
      formatIndianDate(inv.due_date),
      inv.party?.party_name || 'N/A',
      inv.party?.gstin || 'Unregistered',
      inv.place_of_supply,
      inv.taxable_amount.toFixed(2),
      inv.cgst_amount.toFixed(2),
      inv.sgst_amount.toFixed(2),
      inv.igst_amount.toFixed(2),
      inv.cess_amount.toFixed(2),
      inv.total_amount.toFixed(2),
      inv.amount_paid.toFixed(2),
      balance.toFixed(2),
      inv.payment_status.toUpperCase(),
      inv.is_sample ? 'YES' : 'NO'
    ].map(escapeCsvCell).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate CSV for GST Summary (GSTR-1 / GSTR-3B preparation)
 */
export function exportGstSummaryToCsv(invoices: Invoice[]): string {
  const headers = [
    'Invoice Number',
    'Transaction Type',
    'Invoice Date',
    'Party Name',
    'Party GSTIN',
    'Place of Supply',
    'Taxable Value',
    'CGST',
    'SGST',
    'IGST',
    'Cess',
    'Total Invoice Value'
  ];

  const activeInvoices = invoices.filter((i) => i.payment_status !== 'cancelled' && i.payment_status !== 'draft');

  const rows = activeInvoices.map((inv) => [
    inv.invoice_number,
    inv.invoice_type === 'sales' ? 'Outward Supply (Sales)' : 'Inward Supply (Purchase)',
    formatIndianDate(inv.invoice_date),
    inv.party?.party_name || 'N/A',
    inv.party?.gstin || 'URP',
    inv.place_of_supply,
    inv.taxable_amount.toFixed(2),
    inv.cgst_amount.toFixed(2),
    inv.sgst_amount.toFixed(2),
    inv.igst_amount.toFixed(2),
    inv.cess_amount.toFixed(2),
    inv.total_amount.toFixed(2)
  ].map(escapeCsvCell).join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generate CSV for Anomaly Alerts
 */
export function exportAnomaliesToCsv(alerts: AnomalyAlert[]): string {
  const headers = [
    'Alert ID',
    'Anomaly Type',
    'Severity',
    'Status',
    'Detected Date',
    'Description',
    'Associated Invoice ID'
  ];

  const rows = alerts.map((a) => [
    a.id,
    a.anomaly_type,
    a.severity.toUpperCase(),
    a.status.toUpperCase(),
    formatIndianDate(a.created_at.split('T')[0]),
    a.description,
    a.invoice_id || 'N/A'
  ].map(escapeCsvCell).join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Browser download helper for CSV string
 */
export function triggerCsvDownload(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
