import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vlpxhglwybbbgqysxryg.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscHhoZ2x3eWJiYmdxeXN4cnlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk2NzIyMywiZXhwIjoyMTA3NTQzMjIzfQ.AN4UNuxQ5QBvdOJW8HiTHbPzjUfgwhDAbytQtOLRbMc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function runApiSeed() {
  console.log('--- Starting API Seed Process ---');
  
  // 1. Demo Business
  const business = {
    id: 'b0000000-0000-0000-0000-000000000001',
    business_name: 'DemoTech Solutions Private Limited',
    business_type: 'Private Limited Company',
    industry: 'Information Technology',
    address: 'Module 102, TIDEL Park, 4 Rajiv Gandhi Salai, Taramani',
    district: 'Chennai',
    state: 'Tamil Nadu',
    financial_year: '2024-2025',
    gst_registered: true,
    gstin: '33AABCD1234E1Z5',
    startup_recognized: true,
    annual_turnover: 45000000.00,
    is_demo: true,
  };

  const { error: bError } = await supabase.from('businesses').upsert(business);
  if (bError) {
    console.error('Error inserting business:', bError.message);
    return { success: false, error: bError.message };
  }
  console.log('✓ Demo business upserted');

  // 2. Parties
  const parties = [
    { id: 'p0000000-0000-0000-0000-000000000001', business_id: business.id, party_name: 'Vertex Financial Services Ltd', party_type: 'customer', email: 'accounts@vertexfinance.example.com', phone: '+91 98401 11223', address: 'Tower B, Ramanujan IT City, Chennai', state: 'Tamil Nadu', gstin: '33AAACV9876K1Z1', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000002', business_id: business.id, party_name: 'Apex Logistics & Supply Chain', party_type: 'customer', email: 'billing@apexlogistics.example.com', phone: '+91 98402 33445', address: 'Ambattur Industrial Estate, Chennai', state: 'Tamil Nadu', gstin: '33BBBCA1234M1Z2', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000003', business_id: business.id, party_name: 'Kavitha Retail Ventures', party_type: 'customer', email: 'finance@kavitharetail.example.com', phone: '+91 98403 55667', address: 'Cross Cut Road, Gandhipuram, Coimbatore', state: 'Tamil Nadu', gstin: '33CCCCK5678P1Z3', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000004', business_id: business.id, party_name: 'Novus Healthcare Analytics', party_type: 'customer', email: 'invoices@novushealth.example.com', phone: '+91 98804 77889', address: 'Outer Ring Road, Bellandur, Bengaluru', state: 'Karnataka', gstin: '29DDDCN9012Q1Z4', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000005', business_id: business.id, party_name: 'Sahara Digital Payments Pvt Ltd', party_type: 'customer', email: 'payables@saharapay.example.com', phone: '+91 98205 99001', address: 'Bandra Kurla Complex, Mumbai', state: 'Maharashtra', gstin: '27EEECS3456R1Z5', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000006', business_id: business.id, party_name: 'Telangana Agri-Tech Innovations', party_type: 'customer', email: 'contact@agritech.example.com', phone: '+91 98496 12345', address: 'HITEC City, Madhapur, Hyderabad', state: 'Telangana', gstin: '36FFFCT7890S1Z6', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000007', business_id: business.id, party_name: 'CloudScale Infrastructure Services', party_type: 'supplier', email: 'billing@cloudscale.example.com', phone: '+91 98807 23456', address: 'Whitefield Industrial Area, Bengaluru', state: 'Karnataka', gstin: '29GGGCC4567T1Z7', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000008', business_id: business.id, party_name: 'CyberNet Hardware & Peripherals', party_type: 'supplier', email: 'orders@cybernet.example.com', phone: '+91 98408 34567', address: 'Ritchie Street, Mount Road, Chennai', state: 'Tamil Nadu', gstin: '33HHHCC8901U1Z8', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000009', business_id: business.id, party_name: 'Zenith Office Space & Facilities', party_type: 'supplier', email: 'leasing@zenithspaces.example.com', phone: '+91 98409 45678', address: 'OMR IT Corridor, Sholinganallur, Chennai', state: 'Tamil Nadu', gstin: '33IIIZZ2345V1Z9', is_sample: true },
    { id: 'p0000000-0000-0000-0000-000000000010', business_id: business.id, party_name: 'Prism Audit & Compliance Associates', party_type: 'supplier', email: 'contact@prismaudit.example.com', phone: '+91 98110 56789', address: 'Barakhamba Road, Connaught Place, New Delhi', state: 'Delhi', gstin: '07JJJPA6789W1ZA', is_sample: true }
  ];

  const { error: pError } = await supabase.from('parties').upsert(parties);
  if (pError) console.error('Error inserting parties:', pError.message);
  else console.log(`✓ ${parties.length} parties upserted`);

  // 3. Tax Schemes
  const schemes = [
    {
      id: 's0000000-0000-0000-0000-000000000001',
      scheme_code: 'SEC_80IAC',
      scheme_name: 'Section 80-IAC Tax Holiday for Eligible Startups',
      administering_authority: 'DPIIT & CBDT',
      category: 'tax_deduction',
      description: 'Deduction of 100% of profits and gains derived by an eligible startup from an eligible business for 3 consecutive assessment years out of 10 years.',
      applicable_business_types: ['Private Limited Company', 'LLP'],
      eligibility_criteria: { turnover_limit: 100000000, incorporation_after: '2016-04-01', incorporation_before: '2025-03-31', dpiit_recognition_required: true, inter_ministerial_board_cert_required: true },
      benefit_description: '100% profit deduction from taxable income for 3 consecutive years out of 10 years.',
      tax_regime: 'Old Tax Regime / Section 115BAA constraints apply',
      official_source_url: 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
      official_source_title: 'Income Tax Act 1961 - Section 80-IAC Statutory Provision',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000002',
      scheme_code: 'SEC_44AD',
      scheme_name: 'Section 44AD Presumptive Taxation for Small Businesses',
      administering_authority: 'Income Tax Department (CBDT)',
      category: 'presumptive_taxation',
      description: 'Presumptive taxation scheme for eligible resident individuals, HUFs, and partnership firms with turnover up to ₹2 Crore (₹3 Crore if 95%+ digital).',
      applicable_business_types: ['Proprietorship', 'Partnership'],
      eligibility_criteria: { turnover_limit_standard: 20000000, turnover_limit_digital: 30000000, excluded_entities: ['LLP', 'Private Limited Company'] },
      benefit_description: 'Taxable income presumed at 8% of turnover (6% for digital). No audit under Section 44AB.',
      tax_regime: 'Applicable under Old and New Individual tax regimes',
      official_source_url: 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
      official_source_title: 'Income Tax Act 1961 - Section 44AD Special Provisions',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000003',
      scheme_code: 'SEC_44ADA',
      scheme_name: 'Section 44ADA Presumptive Taxation for Professionals',
      administering_authority: 'Income Tax Department (CBDT)',
      category: 'presumptive_taxation',
      description: 'Presumptive taxation scheme for eligible professionals with gross receipts up to ₹50 Lakhs (₹75 Lakhs if 95%+ digital).',
      applicable_business_types: ['Proprietorship', 'Partnership'],
      eligibility_criteria: { gross_receipts_limit_standard: 5000000, gross_receipts_limit_digital: 7500000 },
      benefit_description: '50% of gross receipts deemed as taxable business income. No books maintenance required.',
      tax_regime: 'Both Old & New Tax Regimes',
      official_source_url: 'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
      official_source_title: 'Income Tax Act 1961 - Section 44ADA Provisions for Professions',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000004',
      scheme_code: 'GST_COMPOSITION',
      scheme_name: 'GST Composition Scheme under Section 10',
      administering_authority: 'CBIC',
      category: 'gst_composition',
      description: 'Simplified GST scheme for businesses with turnover up to ₹1.5 Crore paying a flat 1% to 6% without ITC.',
      applicable_business_types: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company'],
      eligibility_criteria: { turnover_limit: 15000000, services_turnover_limit: 5000000, cannot_make_interstate_sales: true },
      benefit_description: 'Simplified quarterly payment (CMP-08) and annual return (GSTR-4). Rate: 1% for traders/manufacturers, 6% for service providers.',
      tax_regime: 'GST Regime',
      official_source_url: 'https://cbic-gst.gov.in/',
      official_source_title: 'Central Goods and Services Tax Act 2017 - Section 10',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000005',
      scheme_code: 'UDYAM_MSME',
      scheme_name: 'Udyam Registration & MSMED Act Protections',
      administering_authority: 'Ministry of MSME',
      category: 'registration_benefit',
      description: 'Official MSME registration providing benefits under the MSMED Act 2006, including Section 43B(h) prompt 45-day payment rule.',
      applicable_business_types: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company'],
      eligibility_criteria: { micro_turnover: 50000000, small_turnover: 500000000 },
      benefit_description: 'Priority lending, penal interest on delayed payments beyond 45 days, 50% concession on patents/trademarks.',
      tax_regime: 'All Regimes',
      official_source_url: 'https://udyamregistration.gov.in/',
      official_source_title: 'Ministry of MSME - Udyam Registration Portal Guidelines',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000006',
      scheme_code: 'CGTMSE_SCHEME',
      scheme_name: 'Credit Guarantee Scheme for Micro & Small Enterprises (CGTMSE)',
      administering_authority: 'SIDBI & Ministry of MSME',
      category: 'credit_guarantee',
      description: 'Credit guarantee coverage to financial institutions for extending collateral-free term loans and working capital up to ₹5 Crore.',
      applicable_business_types: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company'],
      eligibility_criteria: { max_credit_facility: 50000000, msme_category: ['Micro', 'Small'] },
      benefit_description: 'Guarantee coverage of up to 75% to 85% of credit facility up to ₹5 Crore without third-party collateral.',
      tax_regime: 'Financial Facility',
      official_source_url: 'https://www.cgtmse.in/',
      official_source_title: 'CGTMSE Official Operational Guidelines',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000007',
      scheme_code: 'PMMY_MUDRA',
      scheme_name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
      administering_authority: 'NCGTC / Ministry of Finance',
      category: 'loan_scheme',
      description: 'Collateral-free institutional credit up to ₹10 Lakhs (extended to ₹20 Lakhs in Budget 2024 for Tarun borrowers).',
      applicable_business_types: ['Proprietorship', 'Partnership', 'Private Limited Company'],
      eligibility_criteria: { non_corporate_small_business: true },
      benefit_description: 'Low-interest institutional loans with MUDRA Card overdraft facility for working capital.',
      tax_regime: 'Loan Scheme',
      official_source_url: 'https://www.mudra.org.in/',
      official_source_title: 'Pradhan Mantri MUDRA Yojana Portal',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000008',
      scheme_code: 'SISFS_SEED_FUND',
      scheme_name: 'Startup India Seed Fund Scheme (SISFS)',
      administering_authority: 'DPIIT, Ministry of Commerce and Industry',
      category: 'subsidy_grant',
      description: 'Financial assistance to early startups for proof of concept, prototype development, product trials, and commercialization.',
      applicable_business_types: ['Private Limited Company', 'LLP'],
      eligibility_criteria: { dpiit_recognized: true, incorporated_under_2_years: true },
      benefit_description: 'Grant up to ₹20 Lakhs for validation / prototype; Debt or convertible debenture up to ₹50 Lakhs.',
      tax_regime: 'Capital Grant',
      official_source_url: 'https://seedfund.startupindia.gov.in/',
      official_source_title: 'Startup India Seed Fund Scheme Guidelines (DPIIT)',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000009',
      scheme_code: 'TANSEED_STARTUPTN',
      scheme_name: 'Tamil Nadu Startup Seed Grant Fund (TANSEED)',
      administering_authority: 'StartupTN (Govt of Tamil Nadu)',
      category: 'subsidy_grant',
      description: 'Seed grant support provided by the Government of Tamil Nadu to early-stage innovative startups registered in Tamil Nadu.',
      applicable_business_types: ['Private Limited Company', 'LLP'],
      eligibility_criteria: { state_incorporation: 'Tamil Nadu', startuptn_registration: true },
      benefit_description: 'Seed grant up to ₹15 Lakhs in 3 milestone tranches to bridge early-stage funding gaps.',
      tax_regime: 'State Grant',
      official_source_url: 'https://startuptn.in/',
      official_source_title: 'StartupTN Official Portal - TANSEED Guidelines',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000010',
      scheme_code: 'DPIIT_RECOGNITION',
      scheme_name: 'DPIIT Startup India Certificate of Recognition',
      administering_authority: 'DPIIT',
      category: 'registration_benefit',
      description: 'Official recognition unlocking fast-track patent processing, self-certification under 9 environmental/labour laws, and 80-IAC eligibility.',
      applicable_business_types: ['Private Limited Company', 'LLP', 'Partnership'],
      eligibility_criteria: { age_limit_years: 10, turnover_cap: 1000000000 },
      benefit_description: '80% patent rebate, exemption from inspection under 6 labour laws for 3-5 years, angel tax exemption.',
      tax_regime: 'Compliance Relief',
      official_source_url: 'https://www.startupindia.gov.in/content/sih/en/startupgov/startup-recognition-page.html',
      official_source_title: 'Startup India Recognition Guidelines and Notifications',
      verification_status: 'verified',
      is_active: true,
      is_sample: true
    }
  ];

  const { error: sError } = await supabase.from('tax_schemes').upsert(schemes);
  if (sError) console.error('Error inserting tax schemes:', sError.message);
  else console.log(`✓ ${schemes.length} tax schemes upserted`);

  return { success: true };
}

if (process.argv[1]?.endsWith('seed-via-api.mjs')) {
  runApiSeed().then(r => console.log('Done:', r));
}
