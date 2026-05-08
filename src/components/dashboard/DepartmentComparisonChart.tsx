'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryData {
  department_name: string;
  total_requested: number;
}

interface DepartmentComparisonChartProps {
  data: SummaryData[];
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

export function DepartmentComparisonChart({ data, loading }: DepartmentComparisonChartProps) {
  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">Tỉ trọng yêu cầu theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-slate-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Aggregate by department
  const deptMap = new Map<string, number>();
  data.forEach(d => {
    deptMap.set(d.department_name, (deptMap.get(d.department_name) || 0) + d.total_requested);
  });

  const chartData = Array.from(deptMap.entries())
    .map(([name, value]) => ({ name: name || 'Chưa phân', value }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900 text-base">Tỉ trọng yêu cầu theo phòng ban</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                  formatter={(value: any) => [`${value} mặt hàng`, 'Yêu cầu']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
