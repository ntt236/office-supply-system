'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Request } from '@/types';

interface UseRequestsOptions {
  month?: string;
  departmentId?: string;
}

export function useRequests(options: UseRequestsOptions = {}) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('requests')
      .select(`
        *,
        user:users(id, email, role, department_id),
        department:departments(id, name),
        request_items(
          *,
          item:items(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (options.month) {
      query = query.eq('month', options.month);
    }
    if (options.departmentId) {
      query = query.eq('department_id', options.departmentId);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setRequests(data as Request[] || []);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.month, options.departmentId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (
    userId: string,
    departmentId: string,
    month: string,
    items: Array<{ item_id: string; stock: number; requested: number; purchase: number }>
  ) => {
    // Step 1: Insert request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .insert({ user_id: userId, department_id: departmentId, month })
      .select()
      .single();

    if (reqError) {
      if (reqError.code === '23505') {
        throw new Error('Bạn đã tạo yêu cầu cho tháng này rồi.');
      }
      throw reqError;
    }

    // Step 2: Bulk insert request_items
    const requestItems = items
      .filter(i => i.stock > 0 || i.requested > 0)
      .map(i => ({
        request_id: request.id,
        item_id: i.item_id,
        stock: i.stock,
        requested: i.requested,
        purchase: i.purchase,
      }));

    if (requestItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItems);

      if (itemsError) throw itemsError;
    }

    await fetchRequests();
    return request;
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) throw error;
    await fetchRequests();
  };

  return { requests, loading, error, refetch: fetchRequests, createRequest, deleteRequest };
}
