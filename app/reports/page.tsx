'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchInvoices, fetchAnomalyAlerts } from '@/lib/data/store';
import { computeDashboardMetrics } from '@/lib/analytics/kpi';
import { formatINR, formatCompactINR, formatIndianDate } from '@/lib/calculations/currency';
import {
  exportInvoicesToCsv,
  exportGstSummaryToCsv,
  exportAnomaliesToCsv,
  triggerCsvDownload,
} from '@/lib/reports/export';
import { Invoice, AnomalyAlert } from '@/types/database';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';

export default function ReportsPage() {
  const { selectedBusiness, isDemoActive } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Report View
  const [activeReportTab, setActiveReportTab] = useState<
    'register' | 'gst' | 'receivables' | 'payables' | 'monthly'
  >('register');

  useEffect(() => {
    async function load() {
      if (!selectedBusiness) return;
      setIsLoading(true);
      try {
        const [invData, aData] = await Promise.all([
          fetchInvoices(selectedBusiness.id),
          fetchAnomalyAlerts(selectedBusiness.id),
        ]);
        setInvoices(invData);
        setAnomalies(aData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [selectedBusiness]);

  const metrics = useMemo(() => computeDashboardMetrics(invoices), [invoices]);

  // Receivables list (sales with balance > 0)
  const receivables = useMemo(() => {
    return invoices
      .filter((i) => i.invoice_type === 'sales' && i.payment_status !== 'cancelled' && i.payment_status !== 'draft')
      .map((i) => ({
        ...i,
        balance: Math.max(0, i.total_amount - (i.amount_paid || 0)),
      }))
      .filter((i) => i.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [invoices]);

  // Payables list (purchase with balance > 0)
  const payables = useMemo(() => {
    return invoices
      .filter((i) => i.invoice_type === 'purchase' && i.payment_status !== 'cancelled' && i.payment_status !== 'draft')
      .map((i) => ({
        ...i,
        balance: Math.max(0, i.total_amount - (i.amount_paid || 0)),
      }))
      .filter((i) => i.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [invoices]);

  const handleDownloadActiveCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    if (activeReportTab === 'register' || activeReportTab === 'receivables' || activeReportTab === 'payables') {
      const csv = exportInvoicesToCsv(invoices);
      triggerCsvDownload(csv, `Invoice_Register_${today}.csv`);
    } else if (activeReportTab === 'gst') {
      const csv = exportGstSummaryToCsv(invoices);
      triggerCsvDownload(csv, `GST_Summary_GSTR_${today}.csv`);
    } else {
      const csv = exportInvoicesToCsv(invoices);
      triggerCsvDownload(csv, `Financial_Report_${today}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports & Exports</h1>
              {isDemoActive && <Badge variant="warning">Sample Data</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Download CSV data registers, view GST preparation schedules, and generate printable audit statements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Report
            </Button>
            <Button
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadActiveCsv}
            >
              Download CSV
            </Button>
          </div>
        </div>

        {/* Report Type Selector Tabs (Hidden when printing) */}
        <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setActiveReportTab('register')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeReportTab === 'register'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Invoice Register ({invoices.length})
          </button>
          <button
            onClick={() => setActiveReportTab('gst')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeReportTab === 'gst'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            GST Summary (GSTR-1 & 3B)
          </button>
          <button
            onClick={() => setActiveReportTab('receivables')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeReportTab === 'receivables'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Receivables Schedule ({receivables.length})
          </button>
          <button
            onClick={() => setActiveReportTab('payables')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeReportTab === 'payables'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Payables Schedule ({payables.length})
          </button>
          <button
            onClick={() => setActiveReportTab('monthly')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              activeReportTab === 'monthly'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Monthly Financial Statement
          </button>
        </div>

        {/* Printable Report Header */}
        <div className="print-only hidden p-4 border-b border-slate-300 mb-6">
          <h1 className="text-xl font-bold text-slate-900">{selectedBusiness?.business_name}</h1>
          <p className="text-xs text-slate-600">GSTIN: {selectedBusiness?.gstin || 'N/A'} • Financial Year: {selectedBusiness?.financial_year}</p>
          <p className="text-xs text-slate-500">Report Schedule: FY {selectedBusiness?.financial_year || '2024-2025'}</p>
        </div>

        {/* 1. INVOICE REGISTER VIEW */}
        {activeReportTab === 'register' && (
          <Card>
            <CardHeader
              title="Comprehensive Invoice Register"
              subtitle="Full chronological listing of outward and inward supply invoices"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-4 py-3">Party Name</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">CGST</th>
                    <th className="px-4 py-3 text-right">SGST</th>
                    <th className="px-4 py-3 text-right">IGST</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-2.5 font-semibold text-slate-900 font-mono">{inv.invoice_number}</td>
                      <td className="px-3 py-2.5 uppercase text-[10px] font-bold text-slate-500">{inv.invoice_type}</td>
                      <td className="px-4 py-2.5 text-slate-800 truncate max-w-[170px]">{inv.party?.party_name || 'N/A'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatIndianDate(inv.invoice_date)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(inv.taxable_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(inv.cgst_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(inv.sgst_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(inv.igst_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{formatINR(inv.total_amount)}</td>
                      <td className="px-4 py-2.5 text-center capitalize text-[11px] font-medium">{inv.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 2. GST SUMMARY VIEW */}
        {activeReportTab === 'gst' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Taxable Sales</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(metrics.totalTaxableSales)}</p>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-blue-600">Output CGST</span>
                <p className="text-xl font-bold text-blue-900 mt-1">{formatINR(metrics.gstBreakdown.cgst)}</p>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-blue-600">Output SGST</span>
                <p className="text-xl font-bold text-blue-900 mt-1">{formatINR(metrics.gstBreakdown.sgst)}</p>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-purple-600">Output IGST</span>
                <p className="text-xl font-bold text-purple-900 mt-1">{formatINR(metrics.gstBreakdown.igst)}</p>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="GSTR-1 / GSTR-3B Outward & Inward Tax Computation Schedule"
                subtitle="Reconciled tax breakdown required for quarterly and monthly GST portal returns"
              />
              <CardContent className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Gross Outward Supplies (Total Finalized Sales):</span>
                    <span className="font-mono font-bold">{formatINR(metrics.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Total GST Liability Generated (Output Tax):</span>
                    <span className="font-mono font-bold text-blue-600">{formatINR(metrics.totalSalesGst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Recorded Inward Supplies Input Tax (Purchases):</span>
                    <span className="font-mono font-bold text-emerald-600">{formatINR(metrics.totalInputGst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                    <span>Estimated Net Cash Tax Liability (Prior to verified ITC matching):</span>
                    <span className="font-mono text-indigo-700">
                      {formatINR(Math.max(0, metrics.totalSalesGst - metrics.totalInputGst))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. RECEIVABLES SCHEDULE */}
        {activeReportTab === 'receivables' && (
          <Card>
            <CardHeader
              title="Accounts Receivable Schedule (Pending Customer Inflows)"
              subtitle={`Total Outstanding Receivables: ${formatINR(metrics.outstandingReceivables)}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoice Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Total (INR)</th>
                    <th className="px-4 py-3 text-right">Paid (INR)</th>
                    <th className="px-5 py-3 text-right">Balance Due (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receivables.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-2.5 font-semibold text-slate-900 font-mono">{rec.invoice_number}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{rec.party?.party_name || 'N/A'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatIndianDate(rec.invoice_date)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatIndianDate(rec.due_date)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(rec.total_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{formatINR(rec.amount_paid)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-rose-600">{formatINR(rec.balance)}</td>
                    </tr>
                  ))}
                  {receivables.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No outstanding receivables found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. PAYABLES SCHEDULE */}
        {activeReportTab === 'payables' && (
          <Card>
            <CardHeader
              title="Accounts Payable Schedule (Pending Vendor Payments)"
              subtitle={`Total Outstanding Payables: ${formatINR(metrics.outstandingPayables)}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Bill #</th>
                    <th className="px-4 py-3">Supplier / Vendor</th>
                    <th className="px-4 py-3">Bill Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Total (INR)</th>
                    <th className="px-4 py-3 text-right">Paid (INR)</th>
                    <th className="px-5 py-3 text-right">Amount Payable (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payables.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-2.5 font-semibold text-slate-900 font-mono">{pay.invoice_number}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{pay.party?.party_name || 'N/A'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatIndianDate(pay.invoice_date)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatIndianDate(pay.due_date)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatINR(pay.total_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{formatINR(pay.amount_paid)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-amber-600">{formatINR(pay.balance)}</td>
                    </tr>
                  ))}
                  {payables.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No outstanding payables found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 5. MONTHLY FINANCIAL STATEMENT */}
        {activeReportTab === 'monthly' && (
          <Card>
            <CardHeader
              title="Monthly Income & Expense Summary Statement"
              subtitle="Aggregated finalized metrics across monthly operating cycles"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Sales Revenue (INR)</th>
                    <th className="px-4 py-3 text-right">Recorded Purchases (INR)</th>
                    <th className="px-4 py-3 text-right">Net Operating Margin (INR)*</th>
                    <th className="px-4 py-3 text-right">GST Output</th>
                    <th className="px-5 py-3 text-right">Input Tax Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.monthlyTrends.map((m) => {
                    const margin = m.sales - m.purchases;
                    return (
                      <tr key={m.month} className="hover:bg-slate-50/70">
                        <td className="px-5 py-2.5 font-bold text-slate-900 font-mono">{m.month}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-blue-600">{formatINR(m.sales)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">{formatINR(m.purchases)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatINR(margin)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-600">{formatINR(m.gstCollected)}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-slate-600">{formatINR(m.inputGst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Notice Footer */}
        <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            *Operating margin is an illustrative accounting calculation (Sales less recorded Purchase Bills) and does not represent audited statutory Net Taxable Profit or Income Tax liability. Consult a licensed Chartered Accountant for statutory financial statement audit.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
