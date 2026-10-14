'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchInvoices } from '@/lib/data/store';
import { computeDashboardMetrics } from '@/lib/analytics/kpi';
import { formatINR, formatCompactINR } from '@/lib/calculations/currency';
import { Invoice } from '@/types/database';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Percent,
  Receipt,
  Users,
  Building,
  Info,
  Calendar,
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

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

export default function AnalyticsPage() {
  const { selectedBusiness, isDemoActive } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'fy' | 'h1' | 'h2'>('all');

  useEffect(() => {
    async function loadData() {
      if (!selectedBusiness) return;
      setIsLoading(true);
      try {
        const invList = await fetchInvoices(selectedBusiness.id);
        setInvoices(invList);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedBusiness]);

  // Filtered invoices based on financial periods
  const filteredInvoices = useMemo(() => {
    if (periodFilter === 'all') return invoices;
    if (periodFilter === 'fy') {
      return invoices.filter((i) => i.invoice_date >= '2024-04-01' && i.invoice_date <= '2025-03-31');
    }
    if (periodFilter === 'h1') {
      return invoices.filter((i) => i.invoice_date >= '2024-04-01' && i.invoice_date <= '2024-09-30');
    }
    if (periodFilter === 'h2') {
      return invoices.filter((i) => i.invoice_date >= '2024-10-01' && i.invoice_date <= '2025-03-31');
    }
    return invoices;
  }, [invoices, periodFilter]);

  const metrics = useMemo(() => computeDashboardMetrics(filteredInvoices), [filteredInvoices]);

  // Customer-wise sales distribution
  const customerSales = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; gstin: string }>();
    filteredInvoices
      .filter((i) => i.invoice_type === 'sales' && i.payment_status !== 'cancelled' && i.payment_status !== 'draft')
      .forEach((inv) => {
        const name = inv.party?.party_name || 'Unassigned Customer';
        const cur = map.get(name) || { name, total: 0, count: 0, gstin: inv.party?.gstin || 'URP' };
        cur.total += inv.total_amount;
        cur.count += 1;
        map.set(name, cur);
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  // Supplier-wise purchases distribution
  const supplierPurchases = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; gstin: string }>();
    filteredInvoices
      .filter((i) => i.invoice_type === 'purchase' && i.payment_status !== 'cancelled' && i.payment_status !== 'draft')
      .forEach((inv) => {
        const name = inv.party?.party_name || 'Unassigned Supplier';
        const cur = map.get(name) || { name, total: 0, count: 0, gstin: inv.party?.gstin || 'URP' };
        cur.total += inv.total_amount;
        cur.count += 1;
        map.set(name, cur);
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Analytics</h1>
              {isDemoActive && <Badge variant="warning">Sample Data</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-dimensional analysis of sales revenues, vendor expenses, GST collections, and cash collection efficiency
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
            <span className="text-slate-400 pl-2">Period:</span>
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                periodFilter === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriodFilter('fy')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                periodFilter === 'fy' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              FY 2024-25
            </button>
            <button
              onClick={() => setPeriodFilter('h1')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                periodFilter === 'h1' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              H1 (Apr - Sep)
            </button>
            <button
              onClick={() => setPeriodFilter('h2')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                periodFilter === 'h2' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              H2 (Oct - Mar)
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Collection Rate"
            value={`${metrics.collectionRate}%`}
            subtitle="Of finalized sales collected"
            icon={<Percent className="w-5 h-5" />}
            accentColor="emerald"
          />
          <StatCard
            title="Average Invoice Value"
            value={formatINR(metrics.averageInvoiceValue)}
            subtitle="Per sales transaction"
            icon={<Receipt className="w-5 h-5" />}
            accentColor="blue"
          />
          <StatCard
            title="Total Taxable Revenue"
            value={formatINR(metrics.totalTaxableSales)}
            subtitle="Pre-GST sales base"
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="indigo"
          />
          <StatCard
            title="Net Tax Balance"
            value={formatINR(Math.max(0, metrics.totalSalesGst - metrics.totalInputGst))}
            subtitle="Output GST - Input Tax Recorded"
            icon={<BarChart3 className="w-5 h-5" />}
            accentColor="amber"
          />
        </div>

        {/* Visual Charts: Revenue Trend & Monthly Sales vs Purchases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="Monthly Revenue Trend (INR)"
              subtitle="Progressive trajectory of outward sales supplies"
            />
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCompactINR(v)} />
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val)), '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="sales" name="Sales Revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="GST Collections vs Input Tax"
              subtitle="Monthly output tax collected vs vendor tax recorded"
            />
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCompactINR(v)} />
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val)), '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="gstCollected" name="GST Collected (Output)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inputGst" name="Recorded Input Tax" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer & Supplier Distribution Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Customer Sales Distribution</span>
                </div>
              }
              subtitle="Concentration of revenue across key clients"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-3 py-3 text-center">Invoices</th>
                    <th className="px-4 py-3 text-right">Total (INR)</th>
                    <th className="px-5 py-3 text-right">% Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerSales.map((cust) => {
                    const pct = metrics.totalSales > 0 ? ((cust.total / metrics.totalSales) * 100).toFixed(1) : '0';
                    return (
                      <tr key={cust.name} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-semibold text-slate-900 truncate max-w-[180px]">
                          {cust.name}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-500 font-mono">{cust.count}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(cust.total)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-blue-600 font-semibold">{pct}%</td>
                      </tr>
                    );
                  })}
                  {customerSales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No customer sales records in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top Suppliers */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>Supplier Spend Distribution</span>
                </div>
              }
              subtitle="Vendor expense breakdown"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Supplier / Vendor</th>
                    <th className="px-3 py-3 text-center">Bills</th>
                    <th className="px-4 py-3 text-right">Total (INR)</th>
                    <th className="px-5 py-3 text-right">% Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierPurchases.map((supp) => {
                    const pct = metrics.totalPurchases > 0 ? ((supp.total / metrics.totalPurchases) * 100).toFixed(1) : '0';
                    return (
                      <tr key={supp.name} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-semibold text-slate-900 truncate max-w-[180px]">
                          {supp.name}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-500 font-mono">{supp.count}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(supp.total)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600 font-semibold">{pct}%</td>
                      </tr>
                    );
                  })}
                  {supplierPurchases.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No purchase bills recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Legal Advisory Notice */}
        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Input Tax Credit (ITC) Verification Advisory</p>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Input tax recorded on vendor purchase invoices does not automatically confer eligibility for Input Tax Credit under Section 16 & 17(5) of the CGST Act. Legally claiming ITC requires matching invoices with supplier filings in GSTR-2B, actual receipt of goods/services, payment of tax to the government by the vendor, and filing valid GSTR-3B returns. Consult your tax professional for statutory reconciliation.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
