'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Item } from '@/types';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createItem = async (item: Omit<Item, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('items').insert(item).select().single();
    if (error) throw error;
    await fetchItems();
    return data;
  };

  const updateItem = async (id: string, item: Partial<Omit<Item, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('items').update(item).eq('id', id);
    if (error) throw error;
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    await fetchItems();
  };

  return { items, loading, error, refetch: fetchItems, createItem, updateItem, deleteItem };
}
