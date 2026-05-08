'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardMetrics } from '@/types';

interface ChartDataPoint {
  month: string;
  department: string;
  totalRequested: number;
  totalExceeded: number;
}

export function useDashboard(filters?: { month?: string; departmentId?: string }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRequests: 0,
    totalRequestedItems: 0,
    exceededRequests: 0,
    totalDepartments: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [summaryData, setSummaryData] = useState<{ department_name: string; item_name: string; total_requested: number; category: string }[]>([]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);

    // Total requests
    let requestsQuery = supabase.from('requests').select('id', { count: 'exact', head: true });
    if (filters?.month) requestsQuery = requestsQuery.eq('month', filters.month);
    if (filters?.departmentId) requestsQuery = requestsQuery.eq('department_id', filters.departmentId);
    const { count: totalRequests } = await requestsQuery;

    // Total requested items (sum)
    const { data: requestItemsData } = await supabase
      .from('request_items')
      .select('requested, request:requests!inner(month, department_id)');

    let filteredItems: any[] = requestItemsData || [];
    if (filters?.month) {
      filteredItems = filteredItems.filter((ri: any) => ri.request.month === filters.month);
    }
    if (filters?.departmentId) {
      filteredItems = filteredItems.filter((ri: any) => ri.request.department_id === filters.departmentId);
    }
    const totalRequestedItems = filteredItems.reduce((sum: number, ri: any) => sum + (ri.requested || 0), 0);

    // Exceeded requests (requested > default_limit)
    const { data: exceededData } = await supabase
      .from('request_items')
      .select('requested, item:items!inner(default_limit), request:requests!inner(month, department_id)');

    const exceededCount = (exceededData || []).filter((ri: any) => {
      if (filters?.month && ri.request.month !== filters.month) return false;
      if (filters?.departmentId && ri.request.department_id !== filters.departmentId) return false;
      return ri.item.default_limit !== null && ri.requested > ri.item.default_limit;
    }).length;

    // Total departments
    const { count: totalDepartments } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true });

    setMetrics({
      totalRequests: totalRequests || 0,
      totalRequestedItems,
      exceededRequests: exceededCount,
      totalDepartments: totalDepartments || 0,
    });

    // Chart data: requests per department per month
    const { data: chartRaw } = await supabase
      .from('requests')
      .select(`
        month,
        department:departments(name),
        request_items(requested, item:items(default_limit))
      `)
      .order('month');

    const grouped: Record<string, ChartDataPoint> = {};
    (chartRaw || []).forEach((req: any) => {
      const key = `${req.month}-${req.department?.name}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: req.month,
          department: req.department?.name || 'Chưa phân',
          totalRequested: 0,
          totalExceeded: 0,
        };
      }
      (req.request_items || []).forEach((ri: any) => {
        grouped[key].totalRequested += ri.requested || 0;
        if (ri.item?.default_limit !== null && ri.item?.default_limit !== undefined) {
          if (ri.requested > ri.item.default_limit) grouped[key].totalExceeded++;
        }
      });
    });

    setChartData(Object.values(grouped));

    // Fetch department item summary
    const { data: summary } = await supabase.from('department_item_summary').select('*');
    setSummaryData(summary || []);

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.month, filters?.departmentId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, chartData, summaryData, loading };
}
