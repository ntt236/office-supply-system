'use client';

import { useState } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { useDashboard } from '@/hooks/useDashboard';
import { useDepartments } from '@/hooks/useDepartments';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { TopItemsChart } from '@/components/dashboard/TopItemsChart';
import { DepartmentComparisonChart } from '@/components/dashboard/DepartmentComparisonChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClipboardList,
  Package,
  AlertTriangle,
  Building2,
  Download,
  Search,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEffect, useState as useS } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Department } from '@/types';

export function DashboardContent() {
  const [monthFilter, setMonthFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { metrics, chartData, summaryData, loading: metricsLoading } = useDashboard({
    month: monthFilter || undefined,
    departmentId: deptFilter === 'all' ? undefined : (deptFilter || undefined),
  });

  const { requests, loading: requestsLoading } = useRequests({
    month: monthFilter || undefined,
    departmentId: deptFilter === 'all' ? undefined : (deptFilter || undefined),
  });

  const { departments } = useDepartments();

  const filteredRequests = requests.filter(r =>
    !search ||
    r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const rows = filteredRequests.map(r => ({
      'Tháng': r.month,
      'Email': r.user?.email || '',
      'Phòng ban': r.department?.name || '',
      'Ngày tạo': new Date(r.created_at).toLocaleDateString('vi-VN'),
      'Số lượng mặt hàng': r.request_items?.length || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yêu cầu');
    XLSX.writeFile(wb, `dashboard_${monthFilter || 'all'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng yêu cầu"
          value={metrics.totalRequests}
          icon={ClipboardList}
          color="blue"
          loading={metricsLoading}
        />
        <MetricCard
          title="Tổng số lượng yêu cầu"
          value={metrics.totalRequestedItems}
          icon={Package}
          color="green"
          loading={metricsLoading}
        />
        <MetricCard
          title="Mặt hàng vượt mức"
          value={metrics.exceededRequests}
          icon={AlertTriangle}
          color="red"
          loading={metricsLoading}
        />
        <MetricCard
          title="Phòng ban"
          value={metrics.totalDepartments}
          icon={Building2}
          color="purple"
          loading={metricsLoading}
        />
      </div>

      {/* Chart */}
      <RequestsChart data={chartData} loading={metricsLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DepartmentComparisonChart data={summaryData} loading={metricsLoading} />
        <TopItemsChart data={summaryData} loading={metricsLoading} />
      </div>

      {/* Table */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-slate-900 text-base">Danh sách yêu cầu</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 w-48 bg-white border-slate-200 text-slate-900 text-sm placeholder:text-slate-400"
                />
              </div>
              {/* Month filter */}
              <Input
                type="month"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="h-9 w-40 bg-white border-slate-200 text-slate-900 text-sm"
              />
              {/* Dept filter */}
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 w-44 bg-white border-slate-200 text-slate-900 text-sm">
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectItem value="all" className="text-slate-700">Tất cả</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-slate-700">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportExcel}
                className="h-9 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-700/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500">Tháng</TableHead>
                  <TableHead className="text-slate-500">Email</TableHead>
                  <TableHead className="text-slate-500">Phòng ban</TableHead>
                  <TableHead className="text-slate-500">Mặt hàng</TableHead>
                  <TableHead className="text-slate-500">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(r => (
                    <TableRow key={r.id} className="border-slate-200 hover:bg-slate-50">
                      <TableCell className="text-slate-900 font-medium">{r.month}</TableCell>
                      <TableCell className="text-slate-700">{r.user?.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 text-slate-700 bg-white">
                          {r.department?.name || 'Chưa phân'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">{r.request_items?.length || 0} mặt hàng</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
