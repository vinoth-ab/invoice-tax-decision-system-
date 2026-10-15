'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchInvoices, deleteInvoice, saveInvoice } from '@/lib/data/store';
import { formatINR, formatIndianDate } from '@/lib/calculations/currency';
import { exportInvoicesToCsv, triggerCsvDownload } from '@/lib/reports/export';
import { Invoice, PaymentStatus } from '@/types/database';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  CreditCard,
  FileText,
  ArrowUpDown,
  CheckCircle,
  Paperclip,
} from 'lucide-react';

export default function InvoicesPage() {
  const { selectedBusiness } = useBusiness();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'purchase'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Payment Recording modal state
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);

  const loadInvoices = async () => {
    if (!selectedBusiness) return;
    setIsLoading(true);
    try {
      const data = await fetchInvoices(selectedBusiness.id);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [selectedBusiness]);

  // Filtered & sorted invoice list
  const filteredList = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Search term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const numMatch = inv.invoice_number.toLowerCase().includes(term);
          const partyMatch = (inv.party?.party_name || '').toLowerCase().includes(term);
          if (!numMatch && !partyMatch) return false;
        }
        // Type
        if (typeFilter !== 'all' && inv.invoice_type !== typeFilter) return false;
        // Status
        if (statusFilter !== 'all' && inv.payment_status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.invoice_date.localeCompare(a.invoice_date);
        if (sortBy === 'date_asc') return a.invoice_date.localeCompare(b.invoice_date);
        if (sortBy === 'amount_desc') return b.total_amount - a.total_amount;
        if (sortBy === 'amount_asc') return a.total_amount - b.total_amount;
        return 0;
      });
  }, [invoices, searchTerm, typeFilter, statusFilter, sortBy]);

  // Aggregate stats of current filtered view
  const summary = useMemo(() => {
    const totalVal = filteredList.reduce((acc, i) => acc + (i.payment_status !== 'cancelled' ? i.total_amount : 0), 0);
    const paidVal = filteredList.reduce((acc, i) => acc + (i.payment_status !== 'cancelled' ? (i.amount_paid || 0) : 0), 0);
    const balanceDue = Math.max(0, totalVal - paidVal);
    return { totalVal, paidVal, balanceDue, count: filteredList.length };
  }, [filteredList]);

  // Handle deletion
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteInvoice(deleteTargetId);
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle payment recording
  const handleRecordPayment = async () => {
    if (!paymentTargetInvoice) return;
    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsRecordingPayment(true);
    try {
      const newPaid = Math.min(paymentTargetInvoice.total_amount, (paymentTargetInvoice.amount_paid || 0) + amount);
      const newStatus: PaymentStatus = newPaid >= paymentTargetInvoice.total_amount ? 'paid' : 'partially_paid';

      await saveInvoice(
        {
          ...paymentTargetInvoice,
          amount_paid: newPaid,
          payment_status: newStatus,
        },
        paymentTargetInvoice.items || []
      );

      // Refresh local view
      await loadInvoices();
      setPaymentTargetInvoice(null);
      setPaymentAmountInput('');
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportInvoicesToCsv(filteredList);
    triggerCsvDownload(csv, `Invoice_Register_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage, search, record payments, and track compliance for sales & purchase invoices
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Link href="/invoices/new">
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice number or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="sales">Sales (Outward)</option>
                <option value="purchase">Purchase (Inward)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="date_desc">Latest Date First</option>
                <option value="date_asc">Oldest Date First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Aggregate Mini Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Matched Invoices</span>
            <span className="text-base font-bold text-slate-900">{summary.count} Records</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Filtered Total</span>
            <span className="text-base font-bold text-blue-600">{formatINR(summary.totalVal)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Collected / Paid</span>
            <span className="text-base font-bold text-emerald-600">{formatINR(summary.paidVal)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Balance Due</span>
            <span className="text-base font-bold text-rose-600">{formatINR(summary.balanceDue)}</span>
          </div>
        </div>

        {/* Invoice Data Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Party</th>
                  <th className="px-4 py-3.5">Dates</th>
                  <th className="px-4 py-3.5 text-right">Taxable</th>
                  <th className="px-4 py-3.5 text-right">Taxes (GST)</th>
                  <th className="px-4 py-3.5 text-right">Total (INR)</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((inv) => {
                  const taxes = (inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0) + (inv.cess_amount || 0);
                  const balance = Math.max(0, inv.total_amount - (inv.amount_paid || 0));

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-blue-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inv.invoice_number}</span>
                          {inv.document_path && (
                            <span className="inline-flex items-center text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]" title="Attachment included">
                              <Paperclip className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </Link>
                        {inv.is_sample && (
                          <span className="inline-block text-[9px] bg-slate-100 text-slate-500 px-1 rounded mt-0.5">
                            Sample
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                            inv.invoice_type === 'sales'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.invoice_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <p className="font-medium text-slate-900 truncate">{inv.party?.party_name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{inv.place_of_supply}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] whitespace-nowrap">
                        <p className="text-slate-800">Inv: {formatIndianDate(inv.invoice_date)}</p>
                        <p className="text-slate-400">Due: {formatIndianDate(inv.due_date)}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                        {formatINR(inv.taxable_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                        {formatINR(taxes)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.total_amount)}
                        {balance > 0 && inv.payment_status !== 'cancelled' && (
                          <p className="text-[10px] text-rose-500 font-normal">Bal: {formatINR(balance)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={inv.payment_status} />
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment Button if balance exists */}
                          {balance > 0 && inv.payment_status !== 'cancelled' && inv.payment_status !== 'draft' && (
                            <button
                              onClick={() => {
                                setPaymentTargetInvoice(inv);
                                setPaymentAmountInput(balance.toString());
                              }}
                              title="Record Payment"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Invoice */}
                          <Link
                            href={`/invoices/${inv.id}`}
                            title="View / Print Invoice"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete Action */}
                          <button
                            onClick={() => setDeleteTargetId(inv.id)}
                            title="Delete Invoice"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                      No invoices match the selected search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Invoice Record"
          message="Are you sure you want to permanently delete this invoice? This action cannot be undone."
          confirmText="Delete Invoice"
          isDanger={true}
          isLoading={isDeleting}
        />

        {/* Record Payment Modal */}
        <Modal
          isOpen={!!paymentTargetInvoice}
          onClose={() => setPaymentTargetInvoice(null)}
          title="Record Invoice Payment"
          description={`Invoice: ${paymentTargetInvoice?.invoice_number} • Total: ${formatINR(paymentTargetInvoice?.total_amount)}`}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setPaymentTargetInvoice(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRecordPayment} isLoading={isRecordingPayment}>
                Confirm Payment
              </Button>
            </>
          }
        >
          {paymentTargetInvoice && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Total Invoice Amount:</span>
                  <span className="font-semibold text-slate-800">{formatINR(paymentTargetInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatINR(paymentTargetInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1 mt-1">
                  <span>Remaining Balance:</span>
                  <span className="text-rose-600">
                    {formatINR(Math.max(0, paymentTargetInvoice.total_amount - (paymentTargetInvoice.amount_paid || 0)))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  placeholder="Enter payment amount"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
