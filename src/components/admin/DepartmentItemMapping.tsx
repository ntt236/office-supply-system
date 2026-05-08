'use client';

import { useState, useEffect } from 'react';
import { useDepartments } from '@/hooks/useDepartments';
import { useItems } from '@/hooks/useItems';
import { useDepartmentItems } from '@/hooks/useDepartmentItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function DepartmentItemMapping() {
  const { departments, loading: deptsLoading } = useDepartments();
  const { items, loading: itemsLoading } = useItems();
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const { departmentItems, loading: mappingLoading, syncItems } = useDepartmentItems(selectedDeptId);
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Update local state when department changes and mappings are fetched
  useEffect(() => {
    if (departmentItems) {
      setSelectedItems(new Set(departmentItems.map(di => di.item_id)));
    }
  }, [departmentItems]);

  const handleToggleItem = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedItems(next);
  };

  const handleSave = async () => {
    if (!selectedDeptId) return;
    setSaving(true);
    try {
      await syncItems(selectedDeptId, Array.from(selectedItems));
      toast.success('Lưu phân bổ thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu phân bổ');
    } finally {
      setSaving(false);
    }
  };

  if (deptsLoading || itemsLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Group items by category
  const officeSupplies = items.filter(i => i.category === 'office_supply' || !i.category);
  const janitorial = items.filter(i => i.category === 'janitorial');

  return (
    <div className="w-full space-y-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 text-lg">Chọn phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-sm">
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                <SelectValue placeholder="-- Chọn phòng ban --" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedDeptId && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 text-lg">Phân bổ mặt hàng</CardTitle>
            <Button 
              onClick={handleSave} 
              disabled={saving || mappingLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu thay đổi
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {mappingLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-slate-700 mb-3">Văn phòng phẩm ({officeSupplies.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {officeSupplies.map(item => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <Badge
                          key={item.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          onClick={() => handleToggleItem(item.id)}
                        >
                          {item.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {janitorial.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 mt-6">Vệ sinh ({janitorial.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {janitorial.map(item => {
                        const isSelected = selectedItems.has(item.id);
                        return (
                          <Badge
                            key={item.id}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                              isSelected 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            onClick={() => handleToggleItem(item.id)}
                          >
                            {item.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
