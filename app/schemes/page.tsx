'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { fetchTaxSchemes } from '@/lib/data/store';
import { TaxScheme, SchemeCategory } from '@/types/database';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Info,
} from 'lucide-react';

export default function SchemesCatalogPage() {
  const [schemes, setSchemes] = useState<TaxScheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Admin New Scheme Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [newCategory, setNewCategory] = useState<SchemeCategory>('subsidy_grant');
  const [newDesc, setNewDesc] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchTaxSchemes();
        setSchemes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = s.scheme_code.toLowerCase().includes(term);
        const nameMatch = s.scheme_name.toLowerCase().includes(term);
        const descMatch = s.description.toLowerCase().includes(term);
        if (!codeMatch && !nameMatch && !descMatch) return false;
      }
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      return true;
    });
  }, [schemes, searchTerm, categoryFilter]);

  const handleAddScheme = () => {
    if (!newCode.trim() || !newName.trim() || !newSourceUrl.trim()) return;
    const newRecord: TaxScheme = {
      id: `s-custom-${Date.now()}`,
      scheme_code: newCode.trim().toUpperCase(),
      scheme_name: newName.trim(),
      administering_authority: newAuthority.trim() || 'Government Authority',
      category: newCategory,
      description: newDesc.trim() || 'Government support initiative.',
      applicable_business_types: ['Private Limited Company', 'LLP'],
      eligibility_criteria: {},
      benefit_description: newBenefit.trim() || 'Financial / compliance relief.',
      tax_regime: 'All Regimes',
      effective_from: '2024-04-01',
      effective_to: null,
      official_source_url: newSourceUrl.trim(),
      official_source_title: newSourceTitle.trim() || 'Official Gazette / Portal',
      last_verified_at: new Date().toISOString(),
      verification_status: 'verified',
      is_active: true,
      is_sample: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSchemes((prev) => [newRecord, ...prev]);
    setIsAddModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewAuthority('');
    setNewDesc('');
    setNewBenefit('');
    setNewSourceUrl('');
    setNewSourceTitle('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Government Schemes & Tax Provisions
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curated statutory repository linking direct tax provisions, presumptive regimes, MSME credit, and startup subsidies
            </p>
          </div>

          <Button
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Reference Scheme
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheme name, section, or statutory authority..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Categories ({schemes.length})</option>
                <option value="tax_deduction">Tax Deductions</option>
                <option value="presumptive_taxation">Presumptive Taxation</option>
                <option value="gst_composition">GST Composition</option>
                <option value="subsidy_grant">Grants & Subsidies</option>
                <option value="credit_guarantee">Credit Guarantee</option>
                <option value="loan_scheme">Loan Schemes</option>
                <option value="registration_benefit">Registration Benefits</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {scheme.scheme_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{scheme.scheme_name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Authority: {scheme.administering_authority}</p>
                  </div>
                  <StatusBadge status={scheme.verification_status} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {scheme.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Statutory Benefit:</span>
                  <span className="text-slate-700">{scheme.benefit_description}</span>
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                  <span>Category: <strong className="capitalize text-slate-700">{scheme.category.replace(/_/g, ' ')}</strong></span>
                  {scheme.tax_regime && (
                    <span>Regime: <strong className="text-slate-700">{scheme.tax_regime}</strong></span>
                  )}
                  {scheme.last_verified_at && (
                    <span>Verified: <strong className="text-slate-700">{scheme.last_verified_at.split('T')[0]}</strong></span>
                  )}
                </div>
              </div>

              {/* Card Footer with Official Link */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Primary Statutory Source</span>
                <a
                  href={scheme.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <span>{scheme.official_source_title}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>

        {/* Catalog Verification Notice */}
        <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Reference Notice:</strong> All official URLs in this catalog point exclusively to statutory portals (.gov.in / CBIC / CBDT / Startup India / StartupTN). Schemes are maintained as configurable rules separately from code. Before claiming benefits, verify current amendments with authorized notification circulars.
          </p>
        </div>

        {/* Admin Add Scheme Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Reference Scheme / Tax Provision"
          description="Register a verified statutory provision or government support scheme"
          maxWidth="lg"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddScheme}>
                Save Reference Scheme
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheme Code</label>
              <input
                type="text"
                placeholder="e.g. SEC_115BAB"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono uppercase text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheme Title</label>
              <input
                type="text"
                placeholder="e.g. Section 115BAB Concessional Tax"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administering Authority</label>
              <input
                type="text"
                placeholder="e.g. Ministry of Finance / CBDT"
                value={newAuthority}
                onChange={(e) => setNewAuthority(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="tax_deduction">Tax Deduction</option>
                <option value="presumptive_taxation">Presumptive Taxation</option>
                <option value="gst_composition">GST Composition</option>
                <option value="subsidy_grant">Subsidy / Grant</option>
                <option value="credit_guarantee">Credit Guarantee</option>
                <option value="loan_scheme">Loan Scheme</option>
                <option value="registration_benefit">Registration Benefit</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Describe statutory objective, applicability, and criteria..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Benefit Description</label>
              <input
                type="text"
                placeholder="e.g. 15% corporate tax rate instead of 22%/25%"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Statutory Source URL</label>
              <input
                type="url"
                placeholder="https://incometaxindia.gov.in/..."
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Source Title</label>
              <input
                type="text"
                placeholder="e.g. Income Tax Act 1961 Official Gazette"
                value={newSourceTitle}
                onChange={(e) => setNewSourceTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
