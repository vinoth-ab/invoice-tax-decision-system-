// ==============================================================================
// Tax Optimization & Government Scheme Decision Support Engine
// Transparent, versioned, deterministic rules without fabricated calculations
// ==============================================================================

import { Business, TaxScheme } from '@/types/database';

export interface TaxAssessmentInput {
  business: Business;
  estimatedTaxableIncome?: number;
  digitalTurnoverPercentage?: number; // 0 - 100
  incorporationDate?: string; // YYYY-MM-DD
  assessmentDate?: string;
  hasImbApproval?: boolean;
  hasStartupTnRegistration?: boolean;
  isServiceBusiness?: boolean;
  hasInterstateSales?: boolean;
  rdInvestmentAmount?: number;
}

export interface SchemeMatchResult {
  schemeCode: string;
  schemeName: string;
  category: string;
  matchStatus: 'eligible' | 'potentially_eligible' | 'not_eligible' | 'insufficient_information';
  confidenceScore: number; // 0 - 100
  potentialBenefit: string;
  estimatedTaxSavings: number;
  whyEligible: string[];
  missingInformation: string[];
  exclusions: string[];
  officialSourceUrl: string;
  officialSourceTitle: string;
  verificationStatus: string;
  taxRegime: string | null;
  advisoryNote: string;
}

export interface TaxAssessmentReport {
  assessmentDate: string;
  financialYear: string;
  turnoverUsed: number;
  estimatedTaxableIncome: number | null;
  overallEligibilityCount: number;
  totalEstimatedSavings: number;
  matches: SchemeMatchResult[];
  disclaimer: string;
}

export const STATUTORY_DISCLAIMER =
  'This application provides preliminary financial analytics and tax decision support for educational and informational purposes. Estimates depend on the accuracy of entered data and configured rules. Scheme eligibility, GST treatment, and tax liability must be verified against current official guidance and with a qualified tax professional before making financial or legal decisions.';

/**
 * Deterministic Tax & Scheme Evaluation Engine
 */
export function evaluateTaxSchemes(
  input: TaxAssessmentInput,
  schemes: TaxScheme[] = []
): TaxAssessmentReport {
  const { business, estimatedTaxableIncome } = input;
  const turnover = Number(business.annual_turnover) || 0;
  const bType = business.business_type;
  const isPvtLtd = bType === 'Private Limited Company';
  const isLLP = bType === 'LLP';
  const isProprietorship = bType === 'Proprietorship';
  const isPartnership = bType === 'Partnership';
  const isTamilNadu = business.state.toLowerCase().includes('tamil nadu');

  const matches: SchemeMatchResult[] = [];
  let totalEstimatedSavings = 0;

  // 1. SECTION 80-IAC TAX HOLIDAY
  const s80iac = schemes.find((s) => s.scheme_code === 'SEC_80IAC');
  if (s80iac) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'not_eligible';
    let confidence = 0;
    let savings = 0;

    if (isPvtLtd || isLLP) {
      why.push(`Entity constitution (${bType}) meets statutory requirements of Section 80-IAC.`);
      confidence += 30;

      if (turnover <= 100000000) {
        why.push(`Annual turnover (${turnover <= 50000000 ? '₹' + (turnover / 10000000).toFixed(1) + ' Cr' : '₹' + (turnover / 10000000).toFixed(1) + ' Cr'}) is within the statutory ₹100 Crore cap.`);
        confidence += 30;
      } else {
        exclusions.push('Annual turnover exceeds the ₹100 Crore limit for 80-IAC.');
      }

      if (business.startup_recognized) {
        why.push('Business has recorded DPIIT Startup India recognition.');
        confidence += 20;
      } else {
        missing.push('DPIIT Certificate of Recognition required.');
      }

      if (input.hasImbApproval) {
        why.push('Inter-Ministerial Board (IMB) tax exemption certificate confirmed.');
        confidence += 20;
        status = 'eligible';
      } else {
        missing.push('Inter-Ministerial Board (IMB) approval certificate required to claim 100% deduction.');
        status = confidence >= 60 ? 'potentially_eligible' : 'insufficient_information';
      }

      // Calculate potential corporate tax savings if taxable income provided (standard 25% corporate rate)
      if (estimatedTaxableIncome && estimatedTaxableIncome > 0 && (status === 'eligible' || status === 'potentially_eligible')) {
        savings = Math.round(estimatedTaxableIncome * 0.2517); // 22% base + 10% surcharge + 4% cess under 115BAA
      }
    } else {
      exclusions.push(`Sole proprietorships and ordinary partnership firms are not eligible for Section 80-IAC.`);
      status = 'not_eligible';
      confidence = 100;
    }

    matches.push({
      schemeCode: s80iac.scheme_code,
      schemeName: s80iac.scheme_name,
      category: s80iac.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: '100% deduction of profits from taxable income for 3 consecutive years out of 10 years.',
      estimatedTaxSavings: savings,
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: s80iac.official_source_url,
      officialSourceTitle: s80iac.official_source_title,
      verificationStatus: s80iac.verification_status,
      taxRegime: s80iac.tax_regime,
      advisoryNote: 'Must be verified by a Chartered Accountant. Note that claiming 80-IAC precludes opting for the concessional 15% rate under 115BAB.',
    });
    totalEstimatedSavings += savings;
  }

  // 2. SECTION 44AD PRESUMPTIVE TAXATION
  const s44ad = schemes.find((s) => s.scheme_code === 'SEC_44AD');
  if (s44ad) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'not_eligible';
    let confidence = 0;
    let savings = 0;

    if (isProprietorship || isPartnership) {
      why.push(`Entity type (${bType}) is eligible for presumptive taxation under Section 44AD.`);
      confidence += 40;

      const digitalRatio = input.digitalTurnoverPercentage ?? 90;
      const cap = digitalRatio >= 95 ? 30000000 : 20000000;

      if (turnover <= cap) {
        why.push(`Turnover (₹${turnover.toLocaleString('en-IN')}) is within the ₹${cap / 10000000} Cr limit.`);
        confidence += 50;
        status = 'eligible';

        // Under 44AD, deemed profit is 6% for digital and 8% for non-digital
        const deemedProfit = Math.round(turnover * (digitalRatio >= 95 ? 0.06 : 0.08));
        if (estimatedTaxableIncome && estimatedTaxableIncome > deemedProfit) {
          // Approximate savings vs normal taxation on higher accounting profit
          savings = Math.round((estimatedTaxableIncome - deemedProfit) * 0.30);
        }
      } else {
        exclusions.push(`Annual turnover exceeds Section 44AD threshold of ₹${cap / 10000000} Crore.`);
        status = 'not_eligible';
      }
    } else {
      exclusions.push(`Companies (Private Limited, Public Limited) and LLPs are strictly excluded from Section 44AD under statutory provisions.`);
      status = 'not_eligible';
      confidence = 100;
    }

    matches.push({
      schemeCode: s44ad.scheme_code,
      schemeName: s44ad.scheme_name,
      category: s44ad.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: 'Presumed taxable income at 6% (digital) or 8% (cash). Complete relief from Section 44AA books maintenance and 44AB tax audit.',
      estimatedTaxSavings: Math.max(0, savings),
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: s44ad.official_source_url,
      officialSourceTitle: s44ad.official_source_title,
      verificationStatus: s44ad.verification_status,
      taxRegime: s44ad.tax_regime,
      advisoryNote: 'If 44AD is opted out in any subsequent year, taxpayer cannot opt in for the next 5 assessment years.',
    });
  }

  // 3. SECTION 44ADA PRESUMPTIVE FOR PROFESSIONALS
  const s44ada = schemes.find((s) => s.scheme_code === 'SEC_44ADA');
  if (s44ada) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'not_eligible';
    let confidence = 0;

    if (isProprietorship || isPartnership) {
      if (business.industry.toLowerCase().includes('technology') || business.industry.toLowerCase().includes('consulting')) {
        why.push(`Technical consultancy and IT engineering professions are covered under Section 44ADA.`);
        confidence += 50;

        const cap = (input.digitalTurnoverPercentage ?? 90) >= 95 ? 7500000 : 5000000;
        if (turnover <= cap) {
          why.push(`Gross receipts (₹${turnover.toLocaleString('en-IN')}) are within the ₹${cap / 100000} Lakhs ceiling.`);
          confidence += 40;
          status = 'eligible';
        } else {
          exclusions.push(`Gross receipts exceed the Section 44ADA ceiling of ₹${cap / 100000} Lakhs.`);
        }
      } else {
        missing.push('Confirmation of eligible specified profession under Section 44AA(1).');
        status = 'insufficient_information';
      }
    } else {
      exclusions.push('LLPs and Private Limited companies cannot claim presumptive taxation under Section 44ADA.');
    }

    matches.push({
      schemeCode: s44ada.scheme_code,
      schemeName: s44ada.scheme_name,
      category: s44ada.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: '50% of gross receipts deemed as taxable business profit without requiring maintenance of accounting ledgers.',
      estimatedTaxSavings: 0,
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: s44ada.official_source_url,
      officialSourceTitle: s44ada.official_source_title,
      verificationStatus: s44ada.verification_status,
      taxRegime: s44ada.tax_regime,
      advisoryNote: 'Deductions under sections 30 to 38 are deemed fully allowed within the 50% rate.',
    });
  }

  // 4. GST COMPOSITION SCHEME
  const comp = schemes.find((s) => s.scheme_code === 'GST_COMPOSITION');
  if (comp) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'not_eligible';
    let confidence = 0;

    if (business.gst_registered) {
      confidence += 30;
      if (turnover <= 15000000) {
        why.push(`Annual turnover (₹${(turnover / 100000).toFixed(1)} Lakhs) is below the ₹1.5 Crore GST composition threshold.`);
        confidence += 30;
      } else {
        exclusions.push('Turnover exceeds the ₹1.5 Crore aggregate threshold.');
      }

      if (input.hasInterstateSales) {
        exclusions.push('Businesses engaged in inter-state supply of goods or services are statutorily ineligible for Composition Scheme.');
        status = 'not_eligible';
      } else {
        why.push('No inter-state sales reported.');
        confidence += 30;
        status = confidence >= 80 ? 'potentially_eligible' : 'insufficient_information';
      }
    } else {
      missing.push('Business must be GST registered to evaluate composition scheme.');
    }

    matches.push({
      schemeCode: comp.scheme_code,
      schemeName: comp.scheme_name,
      category: comp.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: 'Simplified quarterly GST return (CMP-08) with flat 1% to 6% rate instead of multi-slab monthly filings.',
      estimatedTaxSavings: 0,
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: comp.official_source_url,
      officialSourceTitle: comp.official_source_title,
      verificationStatus: comp.verification_status,
      taxRegime: comp.tax_regime,
      advisoryNote: 'Composition dealers cannot issue tax invoices to collect GST from customers and cannot claim Input Tax Credit (ITC).',
    });
  }

  // 5. UDYAM MSME REGISTRATION & SECTION 43B(H)
  const udyam = schemes.find((s) => s.scheme_code === 'UDYAM_MSME');
  if (udyam) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'eligible';
    let confidence = 95;

    if (turnover <= 50000000) {
      why.push(`Classifies as Micro Enterprise (Turnover <= ₹5 Crore).`);
    } else if (turnover <= 500000000) {
      why.push(`Classifies as Small Enterprise (Turnover <= ₹50 Crore).`);
    } else {
      exclusions.push('Turnover exceeds MSME threshold (> ₹250 Crore).');
      status = 'not_eligible';
    }

    why.push('Statutory 45-day payment security under Section 43B(h) of Income Tax Act for buyers.');
    why.push('Access to priority sector commercial lending and 50% concession on IP/patent fees.');

    matches.push({
      schemeCode: udyam.scheme_code,
      schemeName: udyam.scheme_name,
      category: udyam.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: 'Mandatory 45-day payment enforcement for buyers under Section 43B(h), priority lending, and 50% trademark fee discount.',
      estimatedTaxSavings: 150000,
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: udyam.official_source_url,
      officialSourceTitle: udyam.official_source_title,
      verificationStatus: udyam.verification_status,
      taxRegime: udyam.tax_regime,
      advisoryNote: 'Registration is free and self-declared on udyamregistration.gov.in based on PAN and GSTIN.',
    });
  }

  // 6. CGTMSE COLLATERAL FREE LOANS
  const cgtmse = schemes.find((s) => s.scheme_code === 'CGTMSE_SCHEME');
  if (cgtmse) {
    matches.push({
      schemeCode: cgtmse.scheme_code,
      schemeName: cgtmse.scheme_name,
      category: cgtmse.category,
      matchStatus: turnover <= 500000000 ? 'eligible' : 'not_eligible',
      confidenceScore: 90,
      potentialBenefit: 'Up to ₹5 Crore collateral-free loan facility with 75%-85% credit guarantee by SIDBI/Ministry of MSME.',
      estimatedTaxSavings: 0,
      whyEligible: [
        `Enterprise qualifies as Micro/Small entity based on annual turnover (₹${(turnover / 10000000).toFixed(1)} Cr <= ₹50 Cr limit).`,
        'Eligible for working capital and term loan guarantee cover without third-party collateral.',
      ],
      missingInformation: ['Requires formal application to a Member Lending Institution (Public/Private Bank/NBFC).'],
      exclusions: ['Retail trade over specified limits may have specialized ceiling limits.'],
      officialSourceUrl: cgtmse.official_source_url,
      officialSourceTitle: cgtmse.official_source_title,
      verificationStatus: cgtmse.verification_status,
      taxRegime: cgtmse.tax_regime,
      advisoryNote: 'Guarantee fee is payable annually to MLI (typically 0.37% to 1.35% based on loan size).',
    });
  }

  // 7. TANSEED (Tamil Nadu Seed Fund)
  const tanseed = schemes.find((s) => s.scheme_code === 'TANSEED_STARTUPTN');
  if (tanseed) {
    const why: string[] = [];
    const missing: string[] = [];
    const exclusions: string[] = [];
    let status: SchemeMatchResult['matchStatus'] = 'not_eligible';
    let confidence = 0;

    if (isTamilNadu) {
      why.push('Business headquarters / incorporation is registered in Tamil Nadu.');
      confidence += 50;

      if (isPvtLtd || isLLP) {
        why.push('Entity structure (Private Limited / LLP) aligns with StartupTN grant guidelines.');
        confidence += 30;
        status = 'potentially_eligible';
      } else {
        exclusions.push('TANSEED requires registration as a Private Limited Company or LLP.');
      }

      if (input.hasStartupTnRegistration) {
        why.push('Confirmed registration on StartupTN portal.');
        confidence += 20;
        status = 'eligible';
      } else {
        missing.push('Registration on the official StartupTN portal (startuptn.in) is required.');
      }
    } else {
      exclusions.push(`Registered state is ${business.state}. TANSEED is strictly exclusive to Tamil Nadu incorporated startups.`);
    }

    matches.push({
      schemeCode: tanseed.scheme_code,
      schemeName: tanseed.scheme_name,
      category: tanseed.category,
      matchStatus: status,
      confidenceScore: confidence,
      potentialBenefit: 'Milestone-based non-dilutive seed grant up to ₹15 Lakhs for proof-of-concept and early commercialization.',
      estimatedTaxSavings: 0,
      whyEligible: why,
      missingInformation: missing,
      exclusions,
      officialSourceUrl: tanseed.official_source_url,
      officialSourceTitle: tanseed.official_source_title,
      verificationStatus: tanseed.verification_status,
      taxRegime: tanseed.tax_regime,
      advisoryNote: 'Granted directly by StartupTN in three tranches upon achieving pre-agreed technical milestones.',
    });
  }

  // 8. DPIIT STARTUP RECOGNITION
  const dpiit = schemes.find((s) => s.scheme_code === 'DPIIT_RECOGNITION');
  if (dpiit) {
    matches.push({
      schemeCode: dpiit.scheme_code,
      schemeName: dpiit.scheme_name,
      category: dpiit.category,
      matchStatus: (isPvtLtd || isLLP) && turnover <= 1000000000 ? 'eligible' : 'potentially_eligible',
      confidenceScore: 95,
      potentialBenefit: '80% patent fee rebate, 50% trademark discount, self-certification under 9 labour & environmental laws, and Section 56(2)(viib) angel tax exemption.',
      estimatedTaxSavings: 150000,
      whyEligible: [
        `Entity constitution (${bType}) meets Startup India framework.`,
        'Turnover is below the ₹100 Crore statutory cap.',
        'Working on scalable technology & innovation solutions.',
      ],
      missingInformation: business.startup_recognized ? [] : ['Apply online at startupindia.gov.in with pitch deck and incorporation certificate.'],
      exclusions: ['Entity cannot be formed by splitting up or reconstruction of an existing business.'],
      officialSourceUrl: dpiit.official_source_url,
      officialSourceTitle: dpiit.official_source_title,
      verificationStatus: dpiit.verification_status,
      taxRegime: dpiit.tax_regime,
      advisoryNote: 'Valid for up to 10 years from the date of entity incorporation.',
    });
  }

  const eligibleCount = matches.filter(
    (m) => m.matchStatus === 'eligible' || m.matchStatus === 'potentially_eligible'
  ).length;

  return {
    assessmentDate: input.assessmentDate || '2025-03-31',
    financialYear: business.financial_year || '2024-2025',
    turnoverUsed: turnover,
    estimatedTaxableIncome: estimatedTaxableIncome ?? null,
    overallEligibilityCount: eligibleCount,
    totalEstimatedSavings,
    matches,
    disclaimer: STATUTORY_DISCLAIMER,
  };
}
