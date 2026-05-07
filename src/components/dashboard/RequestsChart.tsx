'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartDataPoint {
  month: string;
  department: string;
  totalRequested: number;
  totalExceeded: number;
}

interface RequestsChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

// Group by month for chart display
function groupByMonth(data: ChartDataPoint[]) {
  const grouped: Record<string, Record<string, number>> = {};
  const departments = new Set<string>();

  data.forEach((point) => {
    if (!grouped[point.month]) grouped[point.month] = {};
    grouped[point.month][point.department] = point.totalRequested;
    departments.add(point.department);
  });

  return {
    chartData: Object.entries(grouped).map(([month, depts]) => ({
      month,
      ...depts,
    })),
    departments: Array.from(departments),
  };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md">
        <p className="text-slate-700 text-sm font-medium mb-2">Tháng {label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="text-slate-900 font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RequestsChart({ data, loading }: RequestsChartProps) {
  const { chartData, departments } = groupByMonth(data);

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">Số lượng yêu cầu theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900 text-base">Số lượng yêu cầu theo tháng</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: '#64748b', fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              {departments.map((dept, idx) => (
                <Bar
                  key={dept}
                  dataKey={dept}
                  name={dept}
                  fill={COLORS[idx % COLORS.length]}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
