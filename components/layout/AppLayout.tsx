'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  LayoutDashboard,
  Building2,
  Users2,
  FileText,
  BarChart3,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Download,
  Settings,
  PlusCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: 'Businesses', href: '/businesses', icon: <Building2 className="w-4 h-4" /> },
  { name: 'Customers & Suppliers', href: '/parties', icon: <Users2 className="w-4 h-4" /> },
  { name: 'Invoices', href: '/invoices', icon: <FileText className="w-4 h-4" /> },
  { name: 'Invoice Analytics', href: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { name: 'Tax Optimization', href: '/tax-optimization', icon: <Sparkles className="w-4 h-4" />, badge: 'AI/Rules' },
  { name: 'Government Schemes', href: '/schemes', icon: <BookOpen className="w-4 h-4" /> },
  { name: 'Anomaly Detection', href: '/anomalies', icon: <AlertTriangle className="w-4 h-4" />, badge: 'Audit' },
  { name: 'Reports', href: '/reports', icon: <Download className="w-4 h-4" /> },
  { name: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

function NavigationLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, businesses, selectedBusiness, setSelectedBusinessId, signOut, isDemoActive } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              ₹
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-white block">FinTax Support</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Invoice & Tax Analytics</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Selector in Sidebar */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Active Business
          </label>
          <div className="relative">
            <select
              value={selectedBusiness?.id || ''}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.business_name} {b.is_demo ? '(Demo)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {isDemoActive && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded px-2 py-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Viewing Sample Demo Workspace</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <React.Suspense fallback={<nav className="flex-1 px-3 py-4 space-y-1" />}>
          <NavigationLinks onNavigate={() => setMobileMenuOpen(false)} />
        </React.Suspense>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {user ? user.email : 'Demo Guest User'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {user ? 'Authenticated' : 'Public Demonstration'}
              </p>
            </div>
            {user ? (
              <button
                onClick={signOut}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/login"
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-slate-900">
                {selectedBusiness?.business_name || 'Business Workspace'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>FY {selectedBusiness?.financial_year || '2024-2025'}</span>
                <span>•</span>
                <span>{selectedBusiness?.state || 'India'}</span>
                {selectedBusiness?.gstin && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">GSTIN: {selectedBusiness.gstin}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Header Tools */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Invoice</span>
            </Link>

            <Link
              href="/tax-optimization"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tax Advisory</span>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 truncate">{user.email}</p>
                      <p className="text-slate-400 text-[10px]">Active Account</p>
                    </div>
                    <Link
                      href="/businesses"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Manage Businesses
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      Settings & Data
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
