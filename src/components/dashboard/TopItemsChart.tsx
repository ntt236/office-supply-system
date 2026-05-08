'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryData {
  department_name: string;
  item_name: string;
  total_requested: number;
}

interface TopItemsChartProps {
  data: SummaryData[];
  loading?: boolean;
}

export function TopItemsChart({ data, loading }: TopItemsChartProps) {
  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 text-base">Top 10 mặt hàng được yêu cầu nhiều nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-slate-50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Aggregate by item
  const itemMap = new Map<string, number>();
  data.forEach(d => {
    itemMap.set(d.item_name, (itemMap.get(d.item_name) || 0) + d.total_requested);
  });

  const chartData = Array.from(itemMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900 text-base">Top mặt hàng được yêu cầu nhiều nhất</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            Chưa có dữ liệu
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Bar dataKey="total" name="Số lượng" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
