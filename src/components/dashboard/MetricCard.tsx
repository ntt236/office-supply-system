'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple';
  suffix?: string;
  loading?: boolean;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    text: 'text-red-600',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    border: 'border-violet-200',
    text: 'text-violet-600',
  },
};

export function MetricCard({ title, value, icon: Icon, color, suffix, loading }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn('border bg-white shadow-sm', colors.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
