'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useBusiness } from '@/lib/context/BusinessContext';
import { createClient } from '@/lib/supabase/client';
import { formatINR } from '@/lib/calculations/currency';
import { INDIAN_STATES } from '@/lib/calculations/gst';
import { Business } from '@/types/database';
import {
  Building2,
  Plus,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  MapPin,
  FileText,
} from 'lucide-react';

export default function BusinessesPage() {
  const { businesses, selectedBusiness, setSelectedBusinessId, refreshBusinesses, user } = useBusiness();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Private Limited Company');
  const [industry, setIndustry] = useState('Information Technology');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [financialYear, setFinancialYear] = useState('2024-2025');
  const [gstRegistered, setGstRegistered] = useState(true);
  const [gstin, setGstin] = useState('');
  const [startupRecognized, setStartupRecognized] = useState(false);
  const [turnover, setTurnover] = useState('10000000');

  const handleCreateBusiness = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Business name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const newBiz: Partial<Business> = {
        owner_id: user?.id || null,
        business_name: name.trim(),
        business_type: type,
        industry,
        address: address.trim() || 'Business Address',
        district: district.trim() || 'Chennai',
        state,
        financial_year: financialYear,
        gst_registered: gstRegistered,
        gstin: gstRegistered && gstin.trim() ? gstin.trim().toUpperCase() : null,
        startup_recognized: startupRecognized,
        annual_turnover: parseFloat(turnover) || 0,
        is_demo: false,
      };

      const { data, error } = await supabase.from('businesses').insert(newBiz).select().single();
      if (error) {
        console.warn('Supabase insert note:', error.message);
      }

      await refreshBusinesses();
      if (data) {
        setSelectedBusinessId(data.id);
      }
      setIsAddModalOpen(false);
      // Reset form
      setName('');
      setAddress('');
      setGstin('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Profiles</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage enterprise entities, tax constitutions, registration details, and financial year scopes
            </p>
          </div>

          <Button
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Business
          </Button>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((b) => {
            const isSelected = selectedBusiness?.id === b.id;

            return (
              <Card
                key={b.id}
                className={`transition-all border-2 ${
                  isSelected ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{b.business_name}</h3>
                      <p className="text-xs text-slate-500">{b.business_type}</p>
                    </div>
                    {b.is_demo ? (
                      <Badge variant="warning">Demo Entity</Badge>
                    ) : (
                      <Badge variant="success">Your Business</Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.district ? `${b.district}, ` : ''}{b.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>FY {b.financial_year} • Industry: {b.industry}</span>
                    </div>
                    {b.gstin ? (
                      <p className="font-mono text-[11px] text-slate-700 pt-1">
                        GSTIN: <strong>{b.gstin}</strong>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic pt-1">Not GST Registered</p>
                    )}
                    <p className="text-xs text-slate-700">
                      Annual Turnover: <strong>{formatINR(b.annual_turnover)}</strong>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isSelected ? (
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Active Workspace
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBusinessId(b.id)}
                        className="text-xs"
                      >
                        Switch to this Business
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Add Business Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Business Profile"
          description="Register a new legal business entity to track invoices and statutory tax benefits"
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateBusiness} isLoading={isSaving}>
                Save Business Profile
              </Button>
            </>
          }
        >
          {errorMsg && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Business / Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Kaveri Tech Ventures Private Limited"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Constitution</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership Firm</option>
                <option value="Public Limited Company">Public Limited Company</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry / Category</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. Chennai / Bengaluru"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Registered Office Address</label>
              <input
                type="text"
                placeholder="Door / Plot No., Building, Street Name, Pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Financial Year</label>
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Turnover (INR)</label>
              <input
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gstRegistered}
                  onChange={(e) => setGstRegistered(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-medium text-slate-700">GST Registered Entity</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startupRecognized}
                  onChange={(e) => setStartupRecognized(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-medium text-slate-700">DPIIT Startup Recognized</span>
              </label>
            </div>

            {gstRegistered && (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional for testing)</label>
                <input
                  type="text"
                  placeholder="e.g. 33AABCD1234E1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono uppercase text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Never required for testing or demonstration.</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
