'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBusiness } from '@/lib/context/BusinessContext';
import { fetchTaxSchemes } from '@/lib/data/store';
import {
  evaluateTaxSchemes,
  TaxAssessmentInput,
  TaxAssessmentReport,
  STATUTORY_DISCLAIMER,
} from '@/lib/tax-rules/engine';
import { formatINR, formatCompactINR } from '@/lib/calculations/currency';
import { TaxScheme } from '@/types/database';
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Building,
  CheckCircle2,
  XCircle,
  Info,
  Scale,
  RefreshCw,
} from 'lucide-react';

export default function TaxOptimizationPage() {
  const { selectedBusiness } = useBusiness();
  const [schemes, setSchemes] = useState<TaxScheme[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Assessment Form State
  const [businessType, setBusinessType] = useState<string>('Private Limited Company');
  const [industry, setIndustry] = useState<string>('Information Technology');
  const [state, setState] = useState<string>('Tamil Nadu');
  const [turnover, setTurnover] = useState<string>('45000000');
  const [estimatedIncome, setEstimatedIncome] = useState<string>('9500000');
  const [digitalRatio, setDigitalRatio] = useState<string>('92');
  const [isStartupRecognized, setIsStartupRecognized] = useState<boolean>(true);
  const [hasImbApproval, setHasImbApproval] = useState<boolean>(false);
  const [hasStartupTn, setHasStartupTn] = useState<boolean>(true);
  const [hasInterstateSales, setHasInterstateSales] = useState<boolean>(true);

  // Active Category Filter for Results
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const sList = await fetchTaxSchemes();
        setSchemes(sList);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Sync initial values with selected business
  useEffect(() => {
    if (selectedBusiness) {
      setBusinessType(selectedBusiness.business_type);
      setIndustry(selectedBusiness.industry);
      setState(selectedBusiness.state);
      setTurnover(selectedBusiness.annual_turnover?.toString() || '45000000');
      setIsStartupRecognized(selectedBusiness.startup_recognized);
    }
  }, [selectedBusiness]);

  // Compute live assessment results based on inputs
  const assessmentReport: TaxAssessmentReport = useMemo(() => {
    if (!selectedBusiness) {
      return {
        assessmentDate: '',
        financialYear: '2024-2025',
        turnoverUsed: 0,
        estimatedTaxableIncome: null,
        overallEligibilityCount: 0,
        totalEstimatedSavings: 0,
        matches: [],
        disclaimer: STATUTORY_DISCLAIMER,
      };
    }

    const customBusiness = {
      ...selectedBusiness,
      business_type: businessType as any,
      industry,
      state,
      annual_turnover: parseFloat(turnover) || 0,
      startup_recognized: isStartupRecognized,
    };

    const input: TaxAssessmentInput = {
      business: customBusiness,
      estimatedTaxableIncome: parseFloat(estimatedIncome) || undefined,
      digitalTurnoverPercentage: parseFloat(digitalRatio) || 90,
      hasImbApproval,
      hasStartupTnRegistration: hasStartupTn,
      hasInterstateSales,
    };

    return evaluateTaxSchemes(input, schemes);
  }, [
    selectedBusiness,
    schemes,
    businessType,
    industry,
    state,
    turnover,
    estimatedIncome,
    digitalRatio,
    isStartupRecognized,
    hasImbApproval,
    hasStartupTn,
    hasInterstateSales,
  ]);

  const filteredMatches = useMemo(() => {
    if (categoryFilter === 'all') return assessmentReport.matches;
    return assessmentReport.matches.filter((m) => m.category === categoryFilter);
  }, [assessmentReport, categoryFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tax Optimization Decision Support
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic rule evaluation comparing business profile with Indian statutory tax provisions and government schemes
              </p>
            </div>
          </div>
        </div>

        {/* Input Configuration & Profile Confirmation Card */}
        <Card className="p-5">
          <CardHeader
            title="Business Financial & Profile Parameters"
            subtitle="Adjust configuration attributes to evaluate statutory tax deductions, presumptive schemes, and grants"
            className="px-0 pt-0 border-b-0 mb-3"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Entity Constitution</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Private Limited Company">Private Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership Firm</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Turnover (INR)</label>
              <input
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Taxable Profit (INR)</label>
              <input
                type="number"
                value={estimatedIncome}
                onChange={(e) => setEstimatedIncome(e.target.value)}
                placeholder="Optional"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Digital Receipts Ratio (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={digitalRatio}
                onChange={(e) => setDigitalRatio(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Checkbox Attributes */}
            <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isStartupRecognized}
                  onChange={(e) => setIsStartupRecognized(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>DPIIT Startup India Recognized</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasImbApproval}
                  onChange={(e) => setHasImbApproval(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Inter-Ministerial Board (IMB) Approval</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasStartupTn}
                  onChange={(e) => setHasStartupTn(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>StartupTN Portal Registered</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasInterstateSales}
                  onChange={(e) => setHasInterstateSales(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Engages in Inter-State Supplies</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Assessment High-Level Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100">
            <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
              Qualified / Potential Schemes
            </span>
            <div className="text-2xl font-bold text-indigo-950 mt-1">
              {assessmentReport.overallEligibilityCount} Schemes
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Based on verifiable statutory criteria</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
              Estimated Direct Tax Savings
            </span>
            <div className="text-2xl font-bold text-emerald-950 mt-1">
              {formatINR(assessmentReport.totalEstimatedSavings)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Subject to professional certification & audit</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
              Assessment Baseline Turnover
            </span>
            <div className="text-2xl font-bold text-blue-950 mt-1">
              {formatCompactINR(assessmentReport.turnoverUsed)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">FY {assessmentReport.financialYear} evaluation</p>
          </Card>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Categories ({assessmentReport.matches.length})
          </button>
          <button
            onClick={() => setCategoryFilter('tax_deduction')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'tax_deduction'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Direct Tax Deductions
          </button>
          <button
            onClick={() => setCategoryFilter('presumptive_taxation')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'presumptive_taxation'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Presumptive Taxation
          </button>
          <button
            onClick={() => setCategoryFilter('subsidy_grant')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'subsidy_grant'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Grants & Subsidies
          </button>
          <button
            onClick={() => setCategoryFilter('registration_benefit')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'registration_benefit'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Statutory Protections
          </button>
        </div>

        {/* Evaluated Scheme Result Cards */}
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const isEligible = match.matchStatus === 'eligible';
            const isPotential = match.matchStatus === 'potentially_eligible';
            const isNotEligible = match.matchStatus === 'not_eligible';

            return (
              <Card
                key={match.schemeCode}
                className={`transition-all border-l-4 ${
                  isEligible
                    ? 'border-l-emerald-500'
                    : isPotential
                    ? 'border-l-blue-500'
                    : 'border-l-slate-300'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{match.schemeName}</h3>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {match.schemeCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        Category: {match.category.replace(/_/g, ' ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEligible && <Badge variant="success">Eligible</Badge>}
                      {isPotential && <Badge variant="default">Potentially Eligible</Badge>}
                      {isNotEligible && <Badge variant="neutral">Not Eligible</Badge>}
                      <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Confidence: {match.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  {/* Potential Benefit Callout */}
                  <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-100 flex items-start gap-2">
                    <Scale className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Potential Benefit: </span>
                      <span className="text-slate-700">{match.potentialBenefit}</span>
                      {match.estimatedTaxSavings > 0 && (
                        <span className="block mt-1 font-bold text-emerald-700">
                          Estimated Tax Savings: {formatINR(match.estimatedTaxSavings)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Why Qualified / Missing / Exclusions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    {/* Why Eligible */}
                    <div>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Assessment Findings:
                      </span>
                      <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                        {match.whyEligible.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing Info or Exclusions */}
                    <div>
                      {match.missingInformation.length > 0 && (
                        <div className="mb-2">
                          <span className="font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                            <Info className="w-3.5 h-3.5 text-amber-600" /> Missing Prerequisites:
                          </span>
                          <ul className="space-y-1 text-amber-900 pl-5 list-disc">
                            {match.missingInformation.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.exclusions.length > 0 && (
                        <div>
                          <span className="font-semibold text-rose-800 flex items-center gap-1.5 mb-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Disqualifications / Exclusions:
                          </span>
                          <ul className="space-y-1 text-rose-900 pl-5 list-disc">
                            {match.exclusions.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statutory Footer with Official Source Link */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Official Statutory Source:</span>
                      <a
                        href={match.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        {match.officialSourceTitle} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-slate-400 italic">
                      {match.advisoryNote}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Mandatory Legal & Statutory Disclaimer */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
              Mandatory Statutory Disclaimer & Non-Filing Advisory
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
              {STATUTORY_DISCLAIMER}
            </p>
            <p className="text-[10px] text-amber-700 pt-1">
              This system does not file returns, disburse grants, or communicate with tax authorities on behalf of the user.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
