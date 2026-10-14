'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchInvoices, fetchAnomalyAlerts, fetchTaxSchemes } from '@/lib/data/store';
import { computeDashboardMetrics } from '@/lib/analytics/kpi';
import { formatINR, formatCompactINR, formatIndianDate } from '@/lib/calculations/currency';
import { evaluateTaxSchemes } from '@/lib/tax-rules/engine';
import { Invoice, AnomalyAlert } from '@/types/database';
import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  AlertTriangle,
  Receipt,
  Wallet,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function DashboardPage() {
  const { selectedBusiness, isDemoActive } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'fy' | 'last30' | 'q3' | 'q4'>('all');

  useEffect(() => {
    async function loadData() {
      if (!selectedBusiness) return;
      setIsLoading(true);
      try {
        const [invData, anomalyData] = await Promise.all([
          fetchInvoices(selectedBusiness.id),
          fetchAnomalyAlerts(selectedBusiness.id),
        ]);
        setInvoices(invData);
        setAnomalies(anomalyData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedBusiness]);

  // Apply selected date filter
  const filteredInvoices = useMemo(() => {
    if (dateFilter === 'all') return invoices;
    if (dateFilter === 'fy') {
      return invoices.filter((i) => i.invoice_date >= '2024-04-01' && i.invoice_date <= '2025-03-31');
    }
    if (dateFilter === 'last30') {
      const cutoff = '2025-01-01';
      return invoices.filter((i) => i.invoice_date >= cutoff);
    }
    if (dateFilter === 'q3') {
      return invoices.filter((i) => i.invoice_date >= '2024-10-01' && i.invoice_date <= '2024-12-31');
    }
    if (dateFilter === 'q4') {
      return invoices.filter((i) => i.invoice_date >= '2025-01-01' && i.invoice_date <= '2025-03-31');
    }
    return invoices;
  }, [invoices, dateFilter]);

  const metrics = useMemo(() => computeDashboardMetrics(filteredInvoices), [filteredInvoices]);

  // Evaluate tax schemes for recommendation widget
  const schemeReport = useMemo(() => {
    if (!selectedBusiness) return null;
    return evaluateTaxSchemes({ business: selectedBusiness });
  }, [selectedBusiness]);

  // Pie chart data for payment status
  const statusPieData = useMemo(() => {
    return [
      { name: 'Paid', value: metrics.paymentStatusCounts.paid },
      { name: 'Partially Paid', value: metrics.paymentStatusCounts.partially_paid },
      { name: 'Unpaid', value: metrics.paymentStatusCounts.unpaid },
      { name: 'Overdue', value: metrics.paymentStatusCounts.overdue },
      { name: 'Draft', value: metrics.paymentStatusCounts.draft },
      { name: 'Cancelled', value: metrics.paymentStatusCounts.cancelled },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // GST breakdown pie
  const gstBreakdownData = useMemo(() => {
    return [
      { name: 'CGST (Central)', value: metrics.gstBreakdown.cgst },
      { name: 'SGST (State)', value: metrics.gstBreakdown.sgst },
      { name: 'IGST (Integrated)', value: metrics.gstBreakdown.igst },
      ...(metrics.gstBreakdown.cess > 0 ? [{ name: 'Cess', value: metrics.gstBreakdown.cess }] : []),
    ].filter((g) => g.value > 0);
  }, [metrics]);

  const recentInvoices = useMemo(() => invoices.slice(0, 6), [invoices]);
  const activeAnomalies = useMemo(
    () => anomalies.filter((a) => a.status === 'open' || a.status === 'investigating').slice(0, 4),
    [anomalies]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header & Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
              {isDemoActive && <Badge variant="warning">Sample Data</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time analytics for {selectedBusiness?.business_name || 'Business'} • FY {selectedBusiness?.financial_year || '2024-2025'}
            </p>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto text-xs shadow-2xs">
            <span className="text-slate-400 pl-2 pr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('fy')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'fy' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              FY 2024-25
            </button>
            <button
              onClick={() => setDateFilter('q3')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'q3' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Q3
            </button>
            <button
              onClick={() => setDateFilter('q4')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'q4' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Q4
            </button>
            <button
              onClick={() => setDateFilter('last30')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === 'last30' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Last 30D
            </button>
          </div>
        </div>

        {/* 8 Primary Financial KPI StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales (Revenue)"
            value={formatINR(metrics.totalSales)}
            subtitle={`Taxable: ${formatCompactINR(metrics.totalTaxableSales)}`}
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="blue"
          />
          <StatCard
            title="Total Purchases (Expenses)"
            value={formatINR(metrics.totalPurchases)}
            subtitle="Recorded vendor bills"
            icon={<TrendingDown className="w-5 h-5" />}
            accentColor="indigo"
          />
          <StatCard
            title="Outstanding Receivables"
            value={formatINR(metrics.outstandingReceivables)}
            subtitle={`Collection Rate: ${metrics.collectionRate}%`}
            icon={<Wallet className="w-5 h-5" />}
            accentColor="emerald"
          />
          <StatCard
            title="Outstanding Payables"
            value={formatINR(metrics.outstandingPayables)}
            subtitle="Pending supplier payments"
            icon={<Receipt className="w-5 h-5" />}
            accentColor="amber"
          />
          <StatCard
            title="GST Output Collected"
            value={formatINR(metrics.totalSalesGst)}
            subtitle="Sales tax liability"
            icon={<FileCheck className="w-5 h-5" />}
            accentColor="blue"
          />
          <StatCard
            title="Recorded Input Tax"
            value={formatINR(metrics.totalInputGst)}
            subtitle="On purchases (subject to ITC rules)"
            icon={<Info className="w-5 h-5" />}
            accentColor="indigo"
          />
          <StatCard
            title="Overdue Invoices"
            value={metrics.overdueInvoicesCount.toString()}
            subtitle={`Totaling ${formatCompactINR(metrics.overdueAmount)}`}
            icon={<Clock className="w-5 h-5" />}
            accentColor={metrics.overdueInvoicesCount > 0 ? 'rose' : 'emerald'}
          />
          <StatCard
            title="Open Anomaly Alerts"
            value={activeAnomalies.length.toString()}
            subtitle="Requires human audit"
            icon={<AlertTriangle className="w-5 h-5" />}
            accentColor={activeAnomalies.length > 0 ? 'rose' : 'emerald'}
          />
        </div>

        {/* Charts Row: Monthly Revenue Trend & GST Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales vs Purchases Chart */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Sales vs Purchases Monthly Trend"
              subtitle="Comparison of finalized sales and purchase invoices across billing cycles"
            />
            <CardContent>
              {metrics.monthlyTrends.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.monthlyTrends}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => formatCompactINR(v)}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatINR(Number(val)), '']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="sales" name="Sales (INR)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="purchases" name="Purchases (INR)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                  No monthly data recorded for this period.
                </div>
              )}
            </CardContent>
          </Card>

          {/* GST Breakdown Donut */}
          <Card>
            <CardHeader
              title="GST Component Breakdown"
              subtitle="Proportion of Central, State & Integrated tax"
            />
            <CardContent>
              {gstBreakdownData.length > 0 ? (
                <div className="h-72 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="75%">
                    <PieChart>
                      <Pie
                        data={gstBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {gstBreakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatINR(Number(val)), '']}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                    {gstBreakdownData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate">{item.name}:</span>
                        <span className="font-semibold text-slate-800">{formatCompactINR(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                  No tax components recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lower Row: Recent Invoices & Decision Support Scheme Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices Table */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent Invoices"
              subtitle="Latest sales and purchase records"
              action={
                <Link
                  href="/invoices"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-blue-600">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                        {inv.party?.party_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`capitalize font-medium ${inv.invoice_type === 'sales' ? 'text-blue-600' : 'text-slate-600'}`}>
                          {inv.invoice_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatIndianDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatINR(inv.total_amount)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge status={inv.payment_status} />
                      </td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No invoices found. Click "New Invoice" to create your first transaction.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tax Advisory & Anomaly Quick Callout */}
          <div className="space-y-6">
            {/* Tax Schemes Match Widget */}
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white">
              <CardHeader
                title={
                  <div className="flex items-center gap-2 text-indigo-950">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Tax Decision Matches</span>
                  </div>
                }
                subtitle={`${schemeReport?.overallEligibilityCount || 0} potential schemes identified`}
              />
              <CardContent>
                <div className="space-y-3">
                  {schemeReport?.matches
                    .filter((m) => m.matchStatus === 'eligible' || m.matchStatus === 'potentially_eligible')
                    .slice(0, 3)
                    .map((m) => (
                      <div key={m.schemeCode} className="p-2.5 rounded-lg bg-white border border-indigo-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900 truncate max-w-[190px]">
                            {m.schemeName}
                          </span>
                          <Badge variant="purple">{m.confidenceScore}%</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{m.potentialBenefit}</p>
                      </div>
                    ))}
                  <Link
                    href="/tax-optimization"
                    className="block text-center w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Run Full Tax Optimization Audit
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Anomaly Alerts Widget */}
            <Card className="border-rose-100">
              <CardHeader
                title={
                  <div className="flex items-center gap-2 text-slate-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Recent Audit Flags</span>
                  </div>
                }
                action={
                  <Link href="/anomalies" className="text-xs text-rose-600 hover:text-rose-700 font-semibold">
                    Review ({activeAnomalies.length})
                  </Link>
                }
              />
              <CardContent className="space-y-2.5">
                {activeAnomalies.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-rose-900">{a.anomaly_type.replace(/_/g, ' ')}</span>
                      <Badge variant="danger">{a.severity.toUpperCase()}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{a.description}</p>
                  </div>
                ))}
                {activeAnomalies.length === 0 && (
                  <div className="py-4 text-center text-emerald-600 text-xs font-medium flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> No high-severity anomalies detected
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="p-3 bg-slate-100/70 rounded-lg text-[11px] text-slate-500 border border-slate-200/80 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Statutory Notice:</strong> Finalized financial figures exclude draft and cancelled invoices. Input tax recorded on purchase bills is displayed as entered and does not constitute a determination of eligible Input Tax Credit (ITC) under Section 16/17 of the CGST Act. Gross sales are not representative of net profit.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
