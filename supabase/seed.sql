-- ==============================================================================
-- Seed Script: supabase/seed.sql
-- Repeatable, idempotent sample dataset for Demonstration & Testing
-- Integrated Invoice Analytics and Tax Optimization Decision Support System
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEMO BUSINESS (Identifiable Demo Business)
-- ------------------------------------------------------------------------------
INSERT INTO public.businesses (
    id,
    owner_id,
    business_name,
    business_type,
    industry,
    address,
    district,
    state,
    financial_year,
    gst_registered,
    gstin,
    startup_recognized,
    annual_turnover,
    is_demo,
    created_at,
    updated_at
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    NULL,
    'DemoTech Solutions Private Limited',
    'Private Limited Company',
    'Information Technology',
    'Module 102, TIDEL Park, 4 Rajiv Gandhi Salai, Taramani',
    'Chennai',
    'Tamil Nadu',
    '2024-2025',
    true,
    '33AABCD1234E1Z5',
    true,
    45000000.00,
    true,
    '2024-04-01 09:00:00+05:30',
    '2024-04-01 09:00:00+05:30'
)
ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    annual_turnover = EXCLUDED.annual_turnover,
    gst_registered = EXCLUDED.gst_registered,
    startup_recognized = EXCLUDED.startup_recognized,
    is_demo = true;

-- ------------------------------------------------------------------------------
-- 2. PARTIES (Customers and Suppliers)
-- ------------------------------------------------------------------------------
INSERT INTO public.parties (id, business_id, party_name, party_type, email, phone, address, state, gstin, is_sample) VALUES
-- Customers
('p0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Vertex Financial Services Ltd', 'customer', 'accounts@vertexfinance.example.com', '+91 98401 11223', 'Tower B, Ramanujan IT City, Chennai', 'Tamil Nadu', '33AAACV9876K1Z1', true),
('p0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Apex Logistics & Supply Chain', 'customer', 'billing@apexlogistics.example.com', '+91 98402 33445', 'Ambattur Industrial Estate, Chennai', 'Tamil Nadu', '33BBBCA1234M1Z2', true),
('p0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Kavitha Retail Ventures', 'customer', 'finance@kavitharetail.example.com', '+91 98403 55667', 'Cross Cut Road, Gandhipuram, Coimbatore', 'Tamil Nadu', '33CCCCK5678P1Z3', true),
('p0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Novus Healthcare Analytics', 'customer', 'invoices@novushealth.example.com', '+91 98804 77889', 'Outer Ring Road, Bellandur, Bengaluru', 'Karnataka', '29DDDCN9012Q1Z4', true),
('p0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Sahara Digital Payments Pvt Ltd', 'customer', 'payables@saharapay.example.com', '+91 98205 99001', 'Bandra Kurla Complex, Mumbai', 'Maharashtra', '27EEECS3456R1Z5', true),
('p0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Telangana Agri-Tech Innovations', 'customer', 'contact@agritech.example.com', '+91 98496 12345', 'HITEC City, Madhapur, Hyderabad', 'Telangana', '36FFFCT7890S1Z6', true),
-- Suppliers
('p0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'CloudScale Infrastructure Services', 'supplier', 'billing@cloudscale.example.com', '+91 98807 23456', 'Whitefield Industrial Area, Bengaluru', 'Karnataka', '29GGGCC4567T1Z7', true),
('p0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'CyberNet Hardware & Peripherals', 'supplier', 'orders@cybernet.example.com', '+91 98408 34567', 'Ritchie Street, Mount Road, Chennai', 'Tamil Nadu', '33HHHCC8901U1Z8', true),
('p0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Zenith Office Space & Facilities', 'supplier', 'leasing@zenithspaces.example.com', '+91 98409 45678', 'OMR IT Corridor, Sholinganallur, Chennai', 'Tamil Nadu', '33IIIZZ2345V1Z9', true),
('p0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Prism Audit & Compliance Associates', 'supplier', 'contact@prismaudit.example.com', '+91 98110 56789', 'Barakhamba Road, Connaught Place, New Delhi', 'Delhi', '07JJJPA6789W1ZA', true)
ON CONFLICT (id) DO UPDATE SET
    party_name = EXCLUDED.party_name,
    party_type = EXCLUDED.party_type,
    state = EXCLUDED.state,
    gstin = EXCLUDED.gstin,
    is_sample = true;

-- ------------------------------------------------------------------------------
-- 3. TAX SCHEMES (10 Verified Statutory References & Support Schemes)
-- ------------------------------------------------------------------------------
INSERT INTO public.tax_schemes (
    id, scheme_code, scheme_name, administering_authority, category, description,
    applicable_business_types, eligibility_criteria, benefit_description, tax_regime,
    effective_from, effective_to, official_source_url, official_source_title,
    last_verified_at, verification_status, is_active, is_sample
) VALUES
(
    's0000000-0000-0000-0000-000000000001',
    'SEC_80IAC',
    'Section 80-IAC Tax Holiday for Eligible Startups',
    'Department for Promotion of Industry and Internal Trade (DPIIT) & CBDT',
    'tax_deduction',
    'Deduction of 100% of profits and gains derived by an eligible startup from an eligible business for 3 consecutive assessment years out of 10 years.',
    '["Private Limited Company", "LLP"]'::jsonb,
    '{"turnover_limit": 100000000, "incorporation_after": "2016-04-01", "incorporation_before": "2025-03-31", "dpiit_recognition_required": true, "inter_ministerial_board_cert_required": true}'::jsonb,
    '100% profit deduction from taxable income for 3 consecutive years out of 10 years from incorporation.',
    'Old Tax Regime / Section 115BAA choice constraints apply',
    '2016-04-01',
    '2025-03-31',
    'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
    'Income Tax Act 1961 - Section 80-IAC Statutory Provision',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000002',
    'SEC_44AD',
    'Section 44AD Presumptive Taxation for Small Businesses',
    'Income Tax Department (Central Board of Direct Taxes)',
    'presumptive_taxation',
    'Presumptive taxation scheme for eligible resident resident individuals, HUFs, and partnership firms engaged in eligible business with turnover up to ₹2 Crore (₹3 Crore if 95%+ transactions are digital).',
    '["Proprietorship", "Partnership"]'::jsonb,
    '{"turnover_limit_standard": 20000000, "turnover_limit_digital": 30000000, "excluded_entities": ["LLP", "Private Limited Company"], "excluded_professions": ["Section 44AA specified professions", "Commission agents"]}'::jsonb,
    'Taxable income presumed at 8% of gross receipts (reduced to 6% for amount received via account payee cheque/bank draft/ECS/digital modes). No requirement to maintain detailed books under Section 44AA.',
    'Applicable under Old and New Individual tax regimes',
    '2010-04-01',
    NULL,
    'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
    'Income Tax Act 1961 - Section 44AD Special Provisions for Computing Profits',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000003',
    'SEC_44ADA',
    'Section 44ADA Presumptive Taxation for Professionals',
    'Income Tax Department (Central Board of Direct Taxes)',
    'presumptive_taxation',
    'Presumptive taxation scheme for eligible professionals (legal, medical, engineering, architecture, accountancy, technical consultancy, interior decoration) with gross receipts up to ₹50 Lakhs (₹75 Lakhs if 95%+ digital).',
    '["Proprietorship", "Partnership"]'::jsonb,
    '{"gross_receipts_limit_standard": 5000000, "gross_receipts_limit_digital": 7500000, "eligible_professions": ["Legal", "Medical", "Engineering", "Architectural", "Accountancy", "Technical Consultancy", "Interior Decoration"]}'::jsonb,
    '50% of gross receipts deemed as taxable business income. No requirement to maintain Section 44AA books of account or undergo tax audit under Section 44AB.',
    'Both Old & New Tax Regimes',
    '2016-04-01',
    NULL,
    'https://incometaxindia.gov.in/Pages/acts/income-tax-act.aspx',
    'Income Tax Act 1961 - Section 44ADA Special Provision for Computing Profits of Profession',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000004',
    'GST_COMPOSITION',
    'GST Composition Scheme under Section 10',
    'Central Board of Indirect Taxes and Customs (CBIC)',
    'gst_composition',
    'Simplified GST scheme for small businesses with aggregate turnover up to ₹1.5 Crore (₹75 Lakhs for Special Category States) paying a flat percentage on turnover without Input Tax Credit mechanism.',
    '["Proprietorship", "Partnership", "LLP", "Private Limited Company"]'::jsonb,
    '{"turnover_limit": 15000000, "services_turnover_limit": 5000000, "cannot_make_interstate_sales": true, "cannot_issue_tax_invoice": true, "cannot_claim_itc": true}'::jsonb,
    'Simplified quarterly payment (CMP-08) and annual return (GSTR-4). 1% for traders & manufacturers, 5% for restaurants, 6% for service providers under notification 2/2019.',
    'Goods and Services Tax Regime',
    '2017-07-01',
    NULL,
    'https://cbic-gst.gov.in/',
    'Central Goods and Services Tax Act 2017 - Section 10 Composition Levy',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000005',
    'UDYAM_MSME',
    'Udyam Registration and MSMED Act Protections',
    'Ministry of Micro, Small and Medium Enterprises',
    'registration_benefit',
    'Official MSME registration providing statutory benefits under the MSMED Act 2006, including Section 43B(h) prompt payment compliance (45-day rule) and priority sector lending.',
    '["Proprietorship", "Partnership", "LLP", "Private Limited Company"]'::jsonb,
    '{"micro_investment": 10000000, "micro_turnover": 50000000, "small_investment": 100000000, "small_turnover": 500000000, "medium_investment": 500000000, "medium_turnover": 2500000000}'::jsonb,
    'Access to collateral-free bank loans under priority sector guidelines, statutory protection against delayed payments with penal compound interest, and 50% concession on patent/trademark filing fees.',
    'All Regimes',
    '2020-07-01',
    NULL,
    'https://udyamregistration.gov.in/',
    'Ministry of MSME - Udyam Registration Portal Official Guidelines',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000006',
    'CGTMSE_SCHEME',
    'Credit Guarantee Scheme for Micro and Small Enterprises (CGTMSE)',
    'Credit Guarantee Fund Trust for Micro and Small Enterprises (SIDBI & Ministry of MSME)',
    'credit_guarantee',
    'Credit guarantee coverage to Member Lending Institutions (MLIs) for extending collateral-free term loans and working capital facilities to new and existing micro and small enterprises up to ₹5 Crore.',
    '["Proprietorship", "Partnership", "LLP", "Private Limited Company"]'::jsonb,
    '{"max_credit_facility": 50000000, "msme_category": ["Micro", "Small"], "collateral_free": true, "manufacturing_or_service": true}'::jsonb,
    'Guarantee coverage of up to 75% to 85% of the sanctioned credit facility up to ₹5 Crore without third-party guarantee or collateral security.',
    'Financial Support / Credit Facility',
    '2000-08-01',
    NULL,
    'https://www.cgtmse.in/',
    'CGTMSE Official Operational Guidelines & Circulars',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000007',
    'PMMY_MUDRA',
    'Pradhan Mantri MUDRA Yojana (PMMY)',
    'National Credit Guarantee Trustee Company / Ministry of Finance',
    'loan_scheme',
    'Provides loans up to ₹10 Lakhs (extended to ₹20 Lakhs in Budget 2024 for Tarun category borrowers who repaid past loans) to non-corporate, non-farm small/micro enterprises.',
    '["Proprietorship", "Partnership", "Private Limited Company"]'::jsonb,
    '{"categories": ["Shishu (up to 50k)", "Kishore (50k to 5L)", "Tarun (5L to 10L/20L)"], "non_corporate_small_business": true}'::jsonb,
    'Low-cost, collateral-free institutional credit with MUDRA Card overdraft facility for working capital requirements.',
    'Institutional Loan Support',
    '2015-04-08',
    NULL,
    'https://www.mudra.org.in/',
    'Pradhan Mantri MUDRA Yojana Official Scheme Portal',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000008',
    'SISFS_SEED_FUND',
    'Startup India Seed Fund Scheme (SISFS)',
    'DPIIT, Ministry of Commerce and Industry',
    'subsidy_grant',
    'Financial assistance to startups for proof of concept, prototype development, product trials, market entry, and commercialization through approved incubators across India.',
    '["Private Limited Company", "LLP"]'::jsonb,
    '{"dpiit_recognized": true, "incorporated_under_2_years": true, "not_received_more_than_10L_prior_monetary_support": true}'::jsonb,
    'Grant up to ₹20 Lakhs for validation of proof of concept or prototype; Debt/convertible debenture investment up to ₹50 Lakhs for market entry and scale-up.',
    'Capital Grant / Seed Assistance',
    '2021-04-01',
    '2025-03-31',
    'https://seedfund.startupindia.gov.in/',
    'Startup India Seed Fund Scheme Guidelines (DPIIT)',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000009',
    'TANSEED_STARTUPTN',
    'Tamil Nadu Startup Seed Grant Fund (TANSEED)',
    'Tamil Nadu Startup and Innovation Mission (StartupTN)',
    'subsidy_grant',
    'Special seed grant support provided by the Government of Tamil Nadu to early-stage innovative startups registered with StartupTN and incorporated in Tamil Nadu.',
    '["Private Limited Company", "LLP"]'::jsonb,
    '{"state_incorporation": "Tamil Nadu", "startuptn_registration": true, "dpiit_recognition": true, "innovative_scalable_product": true}'::jsonb,
    'Seed grant up to ₹15 Lakhs (in 3 tranches: 5L + 5L + 5L) to bridge early-stage funding gaps before venture capital readiness.',
    'State Government Grant',
    '2021-01-01',
    NULL,
    'https://startuptn.in/',
    'StartupTN Official Portal - TANSEED Guidelines',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
),
(
    's0000000-0000-0000-0000-000000000010',
    'DPIIT_RECOGNITION',
    'DPIIT Startup India Certificate of Recognition',
    'Department for Promotion of Industry and Internal Trade',
    'registration_benefit',
    'Official recognition as an innovative startup under the Startup India initiative, unlocking fast-track patent examination, self-certification under 6 labour and 3 environmental laws, and Section 56(2)(viib) angel tax exemption.',
    '["Private Limited Company", "LLP", "Partnership"]'::jsonb,
    '{"age_limit_years": 10, "turnover_cap": 1000000000, "original_entity": true, "working_towards_innovation_or_scalability": true}'::jsonb,
    'Self-certification under labour and environmental laws, 80% rebate in patent application fees, fast-track patent processing, and eligibility to apply for Section 80-IAC tax exemption.',
    'Regulatory & Compliance Relief',
    '2016-01-16',
    NULL,
    'https://www.startupindia.gov.in/content/sih/en/startupgov/startup-recognition-page.html',
    'Startup India Recognition Official Guidelines and Notifications',
    '2024-10-01 00:00:00+05:30',
    'verified',
    true,
    true
)
ON CONFLICT (scheme_code) DO UPDATE SET
    scheme_name = EXCLUDED.scheme_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    eligibility_criteria = EXCLUDED.eligibility_criteria,
    benefit_description = EXCLUDED.benefit_description,
    official_source_url = EXCLUDED.official_source_url,
    verification_status = EXCLUDED.verification_status,
    is_active = true,
    is_sample = true;

-- ------------------------------------------------------------------------------
-- 4. 32 SAMPLE INVOICES (Sales & Purchases across FY 2024-2025)
-- Intra-State (TN to TN -> CGST + SGST), Inter-State (TN to KA/MH/DL -> IGST)
-- Rates: 0%, 5%, 12%, 18%, 28%
-- Payment Statuses: Paid, Unpaid, Partially Paid, Overdue, Cancelled
-- Deliberate anomalies flagged in metadata and seeded alerts
-- ------------------------------------------------------------------------------

-- Delete existing sample invoices for this business before re-inserting to ensure clean repeatability
DELETE FROM public.invoices WHERE business_id = 'b0000000-0000-0000-0000-000000000001' AND is_sample = true;

INSERT INTO public.invoices (
    id, business_id, party_id, invoice_number, invoice_type, invoice_date, due_date,
    financial_year, place_of_supply, subtotal, discount_amount, taxable_amount,
    cgst_amount, sgst_amount, igst_amount, cess_amount, total_amount, amount_paid,
    payment_status, notes, document_path, is_sample
) VALUES
-- April 2024
('inv00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'INV-2024-001', 'sales', '2024-04-10', '2024-05-10', '2024-02025', '33-Tamil Nadu', 250000.00, 0.00, 250000.00, 22500.00, 22500.00, 0.00, 0.00, 295000.00, 295000.00, 'paid', 'Monthly enterprise core software engineering sprint', NULL, true),
('inv00000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000007', 'BILL-2024-04-01', 'purchase', '2024-04-12', '2024-05-12', '2024-2025', '29-Karnataka', 65000.00, 0.00, 65000.00, 0.00, 0.00, 11700.00, 0.00, 76700.00, 76700.00, 'paid', 'Cloud instances, Kubernetes cluster hosting & object storage', NULL, true),
('inv00000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 'INV-2024-002', 'sales', '2024-04-20', '2024-05-20', '2024-2025', '29-Karnataka', 420000.00, 20000.00, 400000.00, 0.00, 0.00, 72000.00, 0.00, 472000.00, 472000.00, 'paid', 'Inter-state healthcare analytics telemetry pipeline integration', NULL, true),
('inv00000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000009', 'BILL-2024-04-02', 'purchase', '2024-04-25', '2024-05-25', '2024-2025', '33-Tamil Nadu', 120000.00, 0.00, 120000.00, 10800.00, 10800.00, 0.00, 0.00, 141600.00, 141600.00, 'paid', 'TIDEL Park office workstation leasing & maintenance charges', NULL, true),

-- May 2024
('inv00000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'INV-2024-003', 'sales', '2024-05-08', '2024-06-08', '2024-2025', '33-Tamil Nadu', 310000.00, 10000.00, 300000.00, 27000.00, 27000.00, 0.00, 0.00, 354000.00, 354000.00, 'paid', 'Logistics dispatch routing optimization software suite', NULL, true),
('inv00000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'INV-2024-004', 'sales', '2024-05-18', '2024-06-18', '2024-2025', '27-Maharashtra', 550000.00, 0.00, 550000.00, 0.00, 0.00, 99000.00, 0.00, 649000.00, 649000.00, 'paid', 'Fintech payment reconciliation gateway licensing', NULL, true),
('inv00000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000008', 'BILL-2024-05-01', 'purchase', '2024-05-22', '2024-06-22', '2024-2025', '33-Tamil Nadu', 180000.00, 0.00, 180000.00, 16200.00, 16200.00, 0.00, 0.00, 212400.00, 212400.00, 'paid', 'Developer laptops and 4K displays procured locally', NULL, true),

-- June 2024
('inv00000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'INV-2024-005', 'sales', '2024-06-05', '2024-07-05', '2024-2025', '33-Tamil Nadu', 150000.00, 0.00, 150000.00, 9000.00, 9000.00, 0.00, 0.00, 168000.00, 168000.00, 'paid', 'Inventory barcode scanning application module (12% tax rate tier)', NULL, true),
('inv00000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000006', 'INV-2024-006', 'sales', '2024-06-19', '2024-07-19', '2024-2025', '36-Telangana', 380000.00, 0.00, 380000.00, 0.00, 0.00, 68400.00, 0.00, 448400.00, 448400.00, 'paid', 'Agri-analytics drone imagery pipeline integration', NULL, true),
('inv00000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000010', 'BILL-2024-06-01', 'purchase', '2024-06-25', '2024-07-25', '2024-2025', '07-Delhi', 80000.00, 0.00, 80000.00, 0.00, 0.00, 14400.00, 0.00, 94400.00, 94400.00, 'paid', 'Statutory audit & GST quarterly filing review charges', NULL, true),

-- July 2024
('inv00000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'INV-2024-007', 'sales', '2024-07-02', '2024-08-02', '2024-2025', '33-Tamil Nadu', 480000.00, 30000.00, 450000.00, 40500.00, 40500.00, 0.00, 0.00, 531000.00, 531000.00, 'paid', 'Quarterly backend modernization & algorithmic security upgrade', NULL, true),
('inv00000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000007', 'BILL-2024-07-01', 'purchase', '2024-07-15', '2024-08-15', '2024-2025', '29-Karnataka', 95000.00, 0.00, 95000.00, 0.00, 0.00, 17100.00, 0.00, 112100.00, 112100.00, 'paid', 'Expanded GPU inference server capacity for AI pilot', NULL, true),
('inv00000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 'INV-2024-008', 'sales', '2024-07-28', '2024-08-28', '2024-2025', '29-Karnataka', 360000.00, 0.00, 360000.00, 0.00, 0.00, 64800.00, 0.00, 424800.00, 424800.00, 'paid', 'Diagnostic lab result integration engine license', NULL, true),

-- August 2024
('inv00000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'INV-2024-009', 'sales', '2024-08-11', '2024-09-11', '2024-2025', '33-Tamil Nadu', 290000.00, 0.00, 290000.00, 26100.00, 26100.00, 0.00, 0.00, 342200.00, 342200.00, 'paid', 'Fleet telematics data ingestion microservices', NULL, true),
('inv00000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'INV-2024-010', 'sales', '2024-08-22', '2024-09-22', '2024-2025', '27-Maharashtra', 620000.00, 20000.00, 600000.00, 0.00, 0.00, 108000.00, 0.00, 708000.00, 708000.00, 'paid', 'Fraud detection rule engine deployment', NULL, true),
('inv00000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000008', 'BILL-2024-08-01', 'purchase', '2024-08-29', '2024-09-29', '2024-2025', '33-Tamil Nadu', 75000.00, 0.00, 75000.00, 10500.00, 10500.00, 0.00, 0.00, 96000.00, 96000.00, 'paid', 'High-speed managed enterprise network switches (28% GST illustrative tier)', NULL, true),

-- September 2024
('inv00000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'INV-2024-011', 'sales', '2024-09-04', '2024-10-04', '2024-2025', '33-Tamil Nadu', 180000.00, 0.00, 180000.00, 16200.00, 16200.00, 0.00, 0.00, 212400.00, 212400.00, 'paid', 'Point-of-sale customer loyalty API service', NULL, true),
('inv00000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000006', 'INV-2024-012', 'sales', '2024-09-17', '2024-10-17', '2024-2025', '36-Telangana', 410000.00, 10000.00, 400000.00, 0.00, 0.00, 72000.00, 0.00, 472000.00, 472000.00, 'paid', 'Warehouse grain sensor IoT monitoring software', NULL, true),
('inv00000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000009', 'BILL-2024-09-01', 'purchase', '2024-09-24', '2024-10-24', '2024-2025', '33-Tamil Nadu', 125000.00, 0.00, 125000.00, 11250.00, 11250.00, 0.00, 0.00, 147500.00, 147500.00, 'paid', 'Q2 Office space facility and fiber internet charges', NULL, true),

-- October 2024
('inv00000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'INV-2024-013', 'sales', '2024-10-09', '2024-11-09', '2024-2025', '33-Tamil Nadu', 520000.00, 20000.00, 500000.00, 45000.00, 45000.00, 0.00, 0.00, 590000.00, 590000.00, 'paid', 'Banking core ledger synchronization architecture', NULL, true),
('inv00000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000007', 'BILL-2024-10-01', 'purchase', '2024-10-18', '2024-11-18', '2024-2025', '29-Karnataka', 110000.00, 0.00, 110000.00, 0.00, 0.00, 19800.00, 0.00, 129800.00, 129800.00, 'paid', 'Managed Kubernetes multi-zone cluster hosting', NULL, true),
('inv00000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 'INV-2024-014', 'sales', '2024-10-27', '2024-11-27', '2024-2025', '29-Karnataka', 340000.00, 0.00, 340000.00, 0.00, 0.00, 61200.00, 0.00, 401200.00, 401200.00, 'paid', 'Biomedical data stream ingestion software', NULL, true),

-- November 2024 (Includes Partially Paid and Unpaid)
('inv00000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'INV-2024-015', 'sales', '2024-11-05', '2024-12-05', '2024-2025', '33-Tamil Nadu', 440000.00, 40000.00, 400000.00, 36000.00, 36000.00, 0.00, 0.00, 472000.00, 250000.00, 'partially_paid', 'Cold-chain dispatch route tracking dashboard', NULL, true),
('inv00000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'INV-2024-016', 'sales', '2024-11-19', '2024-12-19', '2024-2025', '27-Maharashtra', 700000.00, 0.00, 700000.00, 0.00, 0.00, 126000.00, 0.00, 826000.00, 0.00, 'unpaid', 'Merchant settlement multi-bank routing engine', NULL, true),
('inv00000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000010', 'BILL-2024-11-01', 'purchase', '2024-11-26', '2024-12-26', '2024-2025', '07-Delhi', 90000.00, 0.00, 90000.00, 0.00, 0.00, 16200.00, 0.00, 106200.00, 50000.00, 'partially_paid', 'Specialized cybersecurity audit & penetration test fee', NULL, true),

-- December 2024 (Includes Overdue and Special GST Rates)
('inv00000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'INV-2024-017', 'sales', '2024-12-02', '2025-01-02', '2024-2025', '33-Tamil Nadu', 350000.00, 0.00, 350000.00, 31500.00, 31500.00, 0.00, 0.00, 413000.00, 0.00, 'overdue', 'E-commerce billing integration software [OVERDUE PAYMENT]', NULL, true),
('inv00000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000006', 'INV-2024-018', 'sales', '2024-12-14', '2025-01-14', '2024-2025', '36-Telangana', 200000.00, 0.00, 200000.00, 0.00, 0.00, 10000.00, 0.00, 210000.00, 210000.00, 'paid', 'Agricultural open dataset subscription (5% concessional GST tier)', NULL, true),
('inv00000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000007', 'BILL-2024-12-01', 'purchase', '2024-12-20', '2025-01-20', '2024-2025', '29-Karnataka', 130000.00, 0.00, 130000.00, 0.00, 0.00, 23400.00, 0.00, 153400.00, 0.00, 'overdue', 'Annual cloud backup and cold storage retainer [OVERDUE PAYABLE]', NULL, true),

-- January 2025 (Includes Deliberate Anomalies)
-- ANOMALY 1: Duplicate invoice number pattern / identical billing to Vertex
('inv00000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'INV-2025-001-A', 'sales', '2025-01-10', '2025-02-10', '2024-2025', '33-Tamil Nadu', 300000.00, 0.00, 300000.00, 27000.00, 27000.00, 0.00, 0.00, 354000.00, 354000.00, 'paid', 'Custom CRM sync connectors release', NULL, true),
('inv00000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'INV-2025-001-B', 'sales', '2025-01-10', '2025-02-10', '2024-2025', '33-Tamil Nadu', 300000.00, 0.00, 300000.00, 27000.00, 27000.00, 0.00, 0.00, 354000.00, 0.00, 'unpaid', '[ANOMALY: DUPLICATE ENTRY] Identical amount, party, date, and description submitted twice', NULL, true),

-- ANOMALY 2: Unusual Large Invoice Spike (6x historical average)
('inv00000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000004', 'INV-2025-002', 'sales', '2025-01-18', '2025-02-18', '2024-2025', '29-Karnataka', 4500000.00, 0.00, 4500000.00, 0.00, 0.00, 810000.00, 0.00, 5310000.00, 0.00, 'unpaid', '[ANOMALY: STATISTICAL SPIKE] Mega multi-year hospital software license exceeding 6x standard size', NULL, true),

-- ANOMALY 3: Calculation & Rate discrepancy (Intra-state billed with IGST or rate mismatch)
('inv00000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'INV-2025-003', 'sales', '2025-01-25', '2025-02-25', '2024-2025', '33-Tamil Nadu', 200000.00, 0.00, 200000.00, 0.00, 0.00, 36000.00, 0.00, 236000.00, 0.00, 'unpaid', '[ANOMALY: TAX DISCREPANCY] Intra-state Tamil Nadu transaction erroneously tagged with IGST instead of CGST+SGST', NULL, true),

-- February 2025
('inv00000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'INV-2025-004', 'sales', '2025-02-05', '2025-03-05', '2024-2025', '27-Maharashtra', 480000.00, 0.00, 480000.00, 0.00, 0.00, 86400.00, 0.00, 566400.00, 0.00, 'unpaid', 'Payment gateway merchant analytics dashboard upgrade', NULL, true),
('inv00000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000008', 'BILL-2025-02-01', 'purchase', '2025-02-12', '2025-03-12', '2024-2025', '33-Tamil Nadu', 50000.00, 0.00, 50000.00, 4500.00, 4500.00, 0.00, 0.00, 59000.00, 59000.00, 'paid', 'SSD server upgrades and office peripherals', NULL, true),
('inv00000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'INV-2025-005', 'sales', '2025-02-20', '2025-03-20', '2024-2025', '33-Tamil Nadu', 100000.00, 0.00, 100000.00, 0.00, 0.00, 0.00, 0.00, 100000.00, 0.00, 'draft', 'Export software consultancy prototype (0% GST zero-rated draft)', NULL, true);

-- ------------------------------------------------------------------------------
-- 5. INVOICE ITEMS (Line-item breakdowns for sample invoices)
-- ------------------------------------------------------------------------------
INSERT INTO public.invoice_items (
    id, invoice_id, description, hsn_sac_code, quantity, unit_price,
    discount_amount, gst_rate, taxable_amount, cgst_amount, sgst_amount,
    igst_amount, total_amount
) VALUES
-- For INV-2024-001
('item0000-0000-0000-0000-000000000001', 'inv00000-0000-0000-0000-000000000001', 'Senior Full Stack Development Sprint (160 Hours)', '998313', 1.00, 200000.00, 0.00, 18.00, 200000.00, 18000.00, 18000.00, 0.00, 236000.00),
('item0000-0000-0000-0000-000000000002', 'inv00000-0000-0000-0000-000000000001', 'DevOps & CI/CD Pipeline Automation', '998314', 1.00, 50000.00, 0.00, 18.00, 50000.00, 4500.00, 4500.00, 0.00, 59000.00),

-- For BILL-2024-04-01
('item0000-0000-0000-0000-000000000003', 'inv00000-0000-0000-0000-000000000002', 'High-memory Cloud Compute Nodes (Monthly)', '998315', 5.00, 13000.00, 0.00, 18.00, 65000.00, 0.00, 0.00, 11700.00, 76700.00),

-- For INV-2024-002
('item0000-0000-0000-0000-000000000004', 'inv00000-0000-0000-0000-000000000003', 'Healthcare Telemetry Data Pipeline Architecture', '998313', 1.00, 420000.00, 20000.00, 18.00, 400000.00, 0.00, 0.00, 72000.00, 472000.00),

-- For INV-2024-005 (12% GST rate tier example)
('item0000-0000-0000-0000-000000000005', 'inv00000-0000-0000-0000-000000000008', 'Packaged Retail Barcode Utility Software Bundle', '852380', 1.00, 150000.00, 0.00, 12.00, 150000.00, 9000.00, 9000.00, 0.00, 168000.00),

-- For BILL-2024-08-01 (28% GST rate tier example)
('item0000-0000-0000-0000-000000000006', 'inv00000-0000-0000-0000-000000000016', 'Managed Gigabit Enterprise Switch Hardware', '851762', 1.00, 75000.00, 0.00, 28.00, 75000.00, 10500.00, 10500.00, 0.00, 96000.00),

-- For INV-2024-018 (5% GST rate tier example)
('item0000-0000-0000-0000-000000000007', 'inv00000-0000-0000-0000-000000000027', 'Agricultural Research Digital Publications & Data Feed', '490199', 1.00, 200000.00, 0.00, 5.00, 200000.00, 0.00, 0.00, 10000.00, 210000.00),

-- For INV-2025-005 (0% GST rate tier example)
('item0000-0000-0000-0000-000000000008', 'inv00000-0000-0000-0000-000000000035', 'Export Software Engineering Consulting (Zero Rated)', '998313', 1.00, 100000.00, 0.00, 0.00, 100000.00, 0.00, 0.00, 0.00, 100000.00)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. ANOMALY ALERTS (Seeded for the demo business to populate UI immediately)
-- ------------------------------------------------------------------------------
DELETE FROM public.anomaly_alerts WHERE business_id = 'b0000000-0000-0000-0000-000000000001';

INSERT INTO public.anomaly_alerts (
    id, business_id, invoice_id, anomaly_type, severity, description,
    evidence, status, created_at
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'inv00000-0000-0000-0000-000000000030',
    'DUPLICATE_INVOICE_PATTERN',
    'high',
    'Possible duplicate invoice detected: Identical party (Vertex Financial Services), date (2025-01-10), and taxable amount (₹3,00,000.00) matches invoice INV-2025-001-A.',
    '{"matched_invoice_number": "INV-2025-001-A", "party": "Vertex Financial Services Ltd", "amount": 354000.00, "date": "2025-01-10"}'::jsonb,
    'open',
    '2025-01-11 10:30:00+05:30'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'inv00000-0000-0000-0000-000000000031',
    'STATISTICAL_VALUE_OUTLIER',
    'high',
    'Unusually high invoice value (₹53,10,000.00) is 610% higher than the 6-month historical average invoice size (₹4,20,000.00).',
    '{"invoice_amount": 5310000.00, "historical_average": 420000.00, "std_dev_multiple": 4.8}'::jsonb,
    'investigating',
    '2025-01-19 14:15:00+05:30'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'inv00000-0000-0000-0000-000000000032',
    'TAX_TREATMENT_MISMATCH',
    'medium',
    'Place of supply is Tamil Nadu (Intra-state) but IGST was charged instead of CGST (9%) and SGST (9%).',
    '{"business_state": "Tamil Nadu", "party_state": "Tamil Nadu", "expected_tax": "CGST+SGST", "applied_tax": "IGST", "tax_difference": 36000.00}'::jsonb,
    'open',
    '2025-01-26 11:00:00+05:30'
),
(
    'a0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000001',
    'inv00000-0000-0000-0000-000000000026',
    'OVERDUE_RECEIVABLE_FLAG',
    'medium',
    'Invoice INV-2024-017 for Kavitha Retail Ventures (₹4,13,000.00) is past its due date (2025-01-02) with 0 payment recorded.',
    '{"due_date": "2025-01-02", "days_overdue": 42, "unpaid_balance": 413000.00}'::jsonb,
    'investigating',
    '2025-01-15 09:00:00+05:30'
);

-- ------------------------------------------------------------------------------
-- 7. TAX ASSESSMENTS (Pre-calculated baseline assessment for DemoTech)
-- ------------------------------------------------------------------------------
DELETE FROM public.tax_assessments WHERE business_id = 'b0000000-0000-0000-0000-000000000001';

INSERT INTO public.tax_assessments (
    id, business_id, financial_year, assessment_date, turnover_used,
    estimated_taxable_income, potential_benefits, estimated_tax_savings,
    assumptions, warnings, disclaimer
) VALUES (
    't0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '2024-2025',
    '2025-01-31',
    45000000.00,
    9500000.00,
    '[
        {"code": "SEC_80IAC", "name": "Section 80-IAC 3-Year Tax Holiday", "status": "Potentially Eligible", "estimated_savings": 2392000.00, "note": "Requires Inter-Ministerial Board (IMB) certification from DPIIT."},
        {"code": "DPIIT_RECOGNITION", "name": "DPIIT Fast-Track IP & Self-Certification", "status": "Qualified", "estimated_savings": 150000.00, "note": "80% concession on patent filings and exemption from labour inspection for 3 years."},
        {"code": "TANSEED_STARTUPTN", "name": "TANSEED 6.0 Matching Grant", "status": "Potentially Eligible", "estimated_savings": 1500000.00, "note": "Eligible early stage Tamil Nadu startups can receive up to ₹15L grant."}
    ]'::jsonb,
    4042000.00,
    '{"effective_tax_rate": "25.17% (Corporate under 115BAA)", "depreciation_assumed": "Standard WDV", "section_80iac_deduction_applied": true}'::jsonb,
    '["Section 80-IAC requires separate IMB approval beyond basic DPIIT certificate.", "Presumptive taxation under 44AD is NOT applicable to Private Limited Companies."]'::jsonb,
    'This application provides preliminary financial analytics and tax decision support for educational and informational purposes. Estimates depend on the accuracy of entered data and configured rules. Scheme eligibility, GST treatment, and tax liability must be verified against current official guidance and with a qualified tax professional before making financial or legal decisions.'
);
