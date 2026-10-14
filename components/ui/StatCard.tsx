import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
}: StatCardProps) {
  const iconBg = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card className="hover:border-slate-300 transition-all">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[accentColor]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        </div>
        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center text-xs text-slate-500 gap-1.5">
            {trend && (
              <span
                className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {trend?.label && <span>{trend.label}</span>}
            {!trend && subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
