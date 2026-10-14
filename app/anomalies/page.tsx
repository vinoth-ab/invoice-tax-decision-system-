'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchAnomalyAlerts, fetchInvoices, updateAnomalyStatus } from '@/lib/data/store';
import { detectInvoiceAnomalies } from '@/lib/anomaly-detection/engine';
import { formatIndianDate, formatINR } from '@/lib/calculations/currency';
import { exportAnomaliesToCsv, triggerCsvDownload } from '@/lib/reports/export';
import { AnomalyAlert, Invoice, AnomalyStatus } from '@/types/database';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Download,
  Info,
} from 'lucide-react';

export default function AnomaliesPage() {
  const { selectedBusiness, isDemoActive } = useBusiness();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Alert for Evidence Detail Modal
  const [activeAlert, setActiveAlert] = useState<AnomalyAlert | null>(null);

  const loadData = async () => {
    if (!selectedBusiness) return;
    setIsLoading(true);
    try {
      const [alertList, invList] = await Promise.all([
        fetchAnomalyAlerts(selectedBusiness.id),
        fetchInvoices(selectedBusiness.id),
      ]);
      setAlerts(alertList);
      setInvoices(invList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBusiness]);

  // Run live rule-based audit scan across all invoices in this business
  const handleRunAuditScan = async () => {
    if (!selectedBusiness) return;
    setIsScanning(true);
    try {
      const detected = detectInvoiceAnomalies(invoices, selectedBusiness.state);

      // Convert detected anomalies into alert records
      const newAlerts: AnomalyAlert[] = detected.map((d, index) => {
        const inv = invoices.find((i) => i.id === d.invoiceId);
        return {
          id: `alert-scanned-${Date.now()}-${index}`,
          business_id: selectedBusiness.id,
          invoice_id: d.invoiceId,
          invoice: inv || null,
          anomaly_type: d.anomalyType,
          severity: d.severity,
          description: d.description,
          evidence: d.evidence,
          status: 'open',
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date().toISOString(),
        };
      });

      // Merge avoiding duplicate descriptions
      setAlerts((prev) => {
        const existingDescs = new Set(prev.map((a) => a.description));
        const additions = newAlerts.filter((a) => !existingDescs.has(a.description));
        return [...additions, ...prev];
      });
    } catch (err) {
      console.error('Audit scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Change alert status
  const handleUpdateStatus = async (alertId: string, newStatus: AnomalyStatus) => {
    await updateAnomalyStatus(alertId, newStatus);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus, reviewed_at: new Date().toISOString() } : a))
    );
    if (activeAlert?.id === alertId) {
      setActiveAlert((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const typeMatch = a.anomaly_type.toLowerCase().includes(term);
        const descMatch = a.description.toLowerCase().includes(term);
        if (!typeMatch && !descMatch) return false;
      }
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, searchTerm, severityFilter, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = alerts.length;
    const high = alerts.filter((a) => a.severity === 'high').length;
    const open = alerts.filter((a) => a.status === 'open').length;
    const investigating = alerts.filter((a) => a.status === 'investigating').length;
    const resolved = alerts.filter((a) => a.status === 'resolved').length;
    return { total, high, open, investigating, resolved };
  }, [alerts]);

  const handleExportCsv = () => {
    const csv = exportAnomaliesToCsv(filteredAlerts);
    triggerCsvDownload(csv, `Anomaly_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Anomaly Detection</h1>
              {isDemoActive && <Badge variant="warning">Sample Flags</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rule-based integrity engine identifying duplicate invoice billings, tax discrepancies, calculation mismatches, and overdue payment risks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCsv}
            >
              Export Report
            </Button>
            <Button
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleRunAuditScan}
              isLoading={isScanning}
            >
              Run Audit Scan
            </Button>
          </div>
        </div>

        {/* 4 Summary StatCards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Anomalies"
            value={stats.total.toString()}
            subtitle={`${stats.open} pending action`}
            icon={<AlertTriangle className="w-5 h-5" />}
            accentColor="rose"
          />
          <StatCard
            title="High Severity Flags"
            value={stats.high.toString()}
            subtitle="Requires immediate review"
            icon={<ShieldAlert className="w-5 h-5" />}
            accentColor="rose"
          />
          <StatCard
            title="Investigating"
            value={stats.investigating.toString()}
            subtitle="Under active verification"
            icon={<RotateCcw className="w-5 h-5" />}
            accentColor="amber"
          />
          <StatCard
            title="Resolved / Dismissed"
            value={(stats.resolved + (stats.total - stats.open - stats.investigating - stats.resolved)).toString()}
            subtitle="Reviewed by human auditor"
            icon={<ShieldCheck className="w-5 h-5" />}
            accentColor="emerald"
          />
        </div>

        {/* Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anomaly type, invoice ID, or evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Anomalies List Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Anomaly Type</th>
                  <th className="px-4 py-3.5">Description & Evidence</th>
                  <th className="px-4 py-3.5">Associated Invoice</th>
                  <th className="px-4 py-3.5">Detected</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'neutral'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {alert.anomaly_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3.5 max-w-sm">
                      <p className="text-slate-700 font-medium line-clamp-2">{alert.description}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {alert.invoice_id ? (
                        <Link
                          href={`/invoices/${alert.invoice_id}`}
                          className="text-blue-600 hover:underline font-mono font-medium"
                        >
                          View Document
                        </Link>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatIndianDate(alert.created_at.split('T')[0])}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveAlert(alert)}
                          className="text-xs p-1 h-auto"
                        >
                          Evidence
                        </Button>
                        {alert.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(alert.id, 'investigating')}
                            className="text-[11px] px-2 py-1"
                          >
                            Investigate
                          </Button>
                        )}
                        {alert.status === 'investigating' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                            className="text-[11px] px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Resolve
                          </Button>
                        )}
                        {alert.status !== 'dismissed' && alert.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                            title="Dismiss as false positive"
                            className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAlerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No anomalies match the selected filters. Click "Run Audit Scan" to scan all invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Human Audit Principles Notice */}
        <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Human Review Disclaimer:</strong> Detected anomalies are informational compliance flags intended to assist accountants and auditors. Flags do not represent legal determinations of fraud. All flags require professional human verification before taking remedial accounting or legal action.
          </p>
        </div>

        {/* Detailed Evidence Modal */}
        <Modal
          isOpen={!!activeAlert}
          onClose={() => setActiveAlert(null)}
          title={`Audit Evidence: ${activeAlert?.anomaly_type.replace(/_/g, ' ')}`}
          description={`Severity: ${activeAlert?.severity.toUpperCase()} • Status: ${activeAlert?.status.toUpperCase()}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center gap-2">
              {activeAlert?.status === 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => activeAlert && handleUpdateStatus(activeAlert.id, 'investigating')}
                >
                  Mark as Investigating
                </Button>
              )}
              {activeAlert?.status === 'investigating' && (
                <Button
                  size="sm"
                  onClick={() => activeAlert && handleUpdateStatus(activeAlert.id, 'resolved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark as Resolved
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setActiveAlert(null)}>
                Close
              </Button>
            </div>
          }
        >
          {activeAlert && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-1">Audit Finding:</span>
                <p className="text-slate-700 leading-relaxed">{activeAlert.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block mb-1">
                  Structured Verification Evidence (JSON):
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(activeAlert.evidence, null, 2)}
                </pre>
              </div>

              {activeAlert.invoice_id && (
                <div className="pt-2">
                  <Link
                    href={`/invoices/${activeAlert.invoice_id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    → Open Associated Invoice #{activeAlert.invoice_id}
                  </Link>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
