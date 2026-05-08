'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DepartmentItem, Item } from '@/types';
import { useAuth } from './useAuth';

export function useDepartmentItems(departmentId?: string) {
  const [departmentItems, setDepartmentItems] = useState<DepartmentItem[]>([]);
  const [mappedItems, setMappedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  const fetchDepartmentItems = async () => {
    // If no departmentId is explicitly provided, use the logged-in user's department
    const targetDeptId = departmentId || user?.department_id;
    if (!targetDeptId) {
      setMappedItems([]);
      setDepartmentItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('department_items')
      .select('*, item:items(*)')
      .eq('department_id', targetDeptId);

    if (error) {
      console.error('Error fetching department items:', error.message);
    } else {
      setDepartmentItems(data || []);
      const items = (data || []).map((di: any) => di.item).filter(Boolean) as Item[];
      // Sort items by name
      items.sort((a, b) => a.name.localeCompare(b.name));
      setMappedItems(items);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartmentItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, user?.department_id]);

  const assignItem = async (deptId: string, itemId: string) => {
    const { error } = await supabase
      .from('department_items')
      .insert({ department_id: deptId, item_id: itemId });
    if (error) throw error;
    await fetchDepartmentItems();
  };

  const unassignItem = async (deptId: string, itemId: string) => {
    const { error } = await supabase
      .from('department_items')
      .delete()
      .match({ department_id: deptId, item_id: itemId });
    if (error) throw error;
    await fetchDepartmentItems();
  };

  const syncItems = async (deptId: string, itemIds: string[]) => {
    // Delete all existing assignments for this department
    await supabase.from('department_items').delete().eq('department_id', deptId);
    
    // Insert new ones
    if (itemIds.length > 0) {
      const inserts = itemIds.map(id => ({ department_id: deptId, item_id: id }));
      const { error } = await supabase.from('department_items').insert(inserts);
      if (error) throw error;
    }
    
    await fetchDepartmentItems();
  };

  return {
    departmentItems,
    mappedItems,
    loading,
    refetch: fetchDepartmentItems,
    assignItem,
    unassignItem,
    syncItems
  };
}
