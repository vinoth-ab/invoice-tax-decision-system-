import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const styles = {
    default: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'paid':
      return <Badge variant="success">Paid</Badge>;
    case 'partially_paid':
      return <Badge variant="warning">Partially Paid</Badge>;
    case 'unpaid':
      return <Badge variant="neutral">Unpaid</Badge>;
    case 'overdue':
      return <Badge variant="danger">Overdue</Badge>;
    case 'draft':
      return <Badge variant="info">Draft</Badge>;
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'verified':
      return <Badge variant="success">Verified Official</Badge>;
    case 'needs_verification':
      return <Badge variant="warning">Needs Verification</Badge>;
    case 'expired':
      return <Badge variant="danger">Expired</Badge>;
    case 'open':
      return <Badge variant="danger">Open Flag</Badge>;
    case 'investigating':
      return <Badge variant="warning">Investigating</Badge>;
    case 'resolved':
      return <Badge variant="success">Resolved</Badge>;
    case 'dismissed':
      return <Badge variant="neutral">Dismissed</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
