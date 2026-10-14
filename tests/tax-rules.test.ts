import { describe, it, expect } from 'vitest';
import { evaluateTaxSchemes, STATUTORY_DISCLAIMER } from '../lib/tax-rules/engine';
import { Business, TaxScheme } from '../types/database';

const mockSchemes: TaxScheme[] = [
  {
    id: '1',
    scheme_code: 'SEC_80IAC',
    scheme_name: 'Section 80-IAC',
    administering_authority: 'DPIIT & CBDT',
    category: 'tax_deduction',
    description: '100% tax holiday for 3 years',
    applicable_business_types: ['Private Limited Company', 'LLP'],
    eligibility_criteria: { turnover_limit: 100000000 },
    benefit_description: '100% deduction',
    tax_regime: 'Old Regime',
    effective_from: '2016-04-01',
    effective_to: '2025-03-31',
    official_source_url: 'https://incometaxindia.gov.in',
    official_source_title: 'Income Tax Act',
    last_verified_at: '2024-10-01',
    verification_status: 'verified',
    is_active: true,
    is_sample: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    scheme_code: 'SEC_44AD',
    scheme_name: 'Section 44AD',
    administering_authority: 'CBDT',
    category: 'presumptive_taxation',
    description: 'Presumptive taxation',
    applicable_business_types: ['Proprietorship', 'Partnership'],
    eligibility_criteria: { turnover_limit_standard: 20000000 },
    benefit_description: '8% / 6% deemed profit',
    tax_regime: 'All',
    effective_from: '2010-04-01',
    effective_to: null,
    official_source_url: 'https://incometaxindia.gov.in',
    official_source_title: 'Income Tax Act',
    last_verified_at: '2024-10-01',
    verification_status: 'verified',
    is_active: true,
    is_sample: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: '3',
    scheme_code: 'UDYAM_MSME',
    scheme_name: 'Udyam Registration',
    administering_authority: 'Ministry of MSME',
    category: 'registration_benefit',
    description: 'MSME registration benefits',
    applicable_business_types: ['Private Limited Company', 'Proprietorship'],
    eligibility_criteria: {},
    benefit_description: 'Priority lending and 45-day payment rule',
    tax_regime: 'All',
    effective_from: '2020-07-01',
    effective_to: null,
    official_source_url: 'https://udyamregistration.gov.in',
    official_source_title: 'Udyam Portal',
    last_verified_at: '2024-10-01',
    verification_status: 'verified',
    is_active: true,
    is_sample: true,
    created_at: '',
    updated_at: '',
  },
];

describe('Tax Optimization Decision Support Engine', () => {
  const pvtLtdBusiness: Business = {
    id: 'b-1',
    owner_id: 'user-1',
    business_name: 'Tech Ventures Pvt Ltd',
    business_type: 'Private Limited Company',
    industry: 'Information Technology',
    address: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    financial_year: '2024-2025',
    gst_registered: true,
    gstin: '33AABCD1234E1Z5',
    startup_recognized: true,
    annual_turnover: 25000000,
    is_demo: false,
    created_at: '',
    updated_at: '',
  };

  it('evaluates Private Limited company correctly for Section 80-IAC and excludes from 44AD', () => {
    const report = evaluateTaxSchemes({ business: pvtLtdBusiness }, mockSchemes);

    const s80iac = report.matches.find((m) => m.schemeCode === 'SEC_80IAC');
    expect(s80iac).toBeDefined();
    expect(s80iac?.matchStatus).toMatch(/eligible|potentially_eligible/);
    expect(s80iac?.missingInformation.length).toBeGreaterThan(0); // IMB approval check

    const s44ad = report.matches.find((m) => m.schemeCode === 'SEC_44AD');
    expect(s44ad?.matchStatus).toBe('not_eligible');
    expect(s44ad?.exclusions.some((e) => e.includes('Private Limited'))).toBe(true);
  });

  it('evaluates Sole Proprietorship correctly for Section 44AD', () => {
    const propBusiness: Business = {
      ...pvtLtdBusiness,
      business_type: 'Proprietorship',
      annual_turnover: 12000000, // 1.2 Crore
    };

    const report = evaluateTaxSchemes({ business: propBusiness }, mockSchemes);
    const s44ad = report.matches.find((m) => m.schemeCode === 'SEC_44AD');
    expect(s44ad?.matchStatus).toBe('eligible');
  });

  it('always includes the mandatory legal disclaimer', () => {
    const report = evaluateTaxSchemes({ business: pvtLtdBusiness }, mockSchemes);
    expect(report.disclaimer).toBe(STATUTORY_DISCLAIMER);
    expect(report.disclaimer).toContain('preliminary financial analytics and tax decision support');
  });
});
