'use client';

import { useState } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { useAuth } from '@/hooks/useAuth';
import { RequestDetailDialog } from '@/components/requests/RequestDetailDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Trash2, Download, Search, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Request } from '@/types';
import { toast } from 'sonner';

export function RequestList() {
  const { user } = useAuth();
  const { requests, loading, deleteRequest } = useRequests();
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const filteredRequests = requests.filter(r =>
    !search ||
    r.month.includes(search) ||
    r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) return;
    
    setDeletingId(id);
    try {
      await deleteRequest(id);
      toast.success('Xóa yêu cầu thành công');
    } catch (err: unknown) {
      toast.error('Lỗi khi xóa yêu cầu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (request: Request) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const exportExcel = () => {
    const rows = filteredRequests.map(r => ({
      'Tháng': r.month,
      'Email': r.user?.email || '',
      'Phòng ban': r.department?.name || '',
      'Ngày tạo': new Date(r.created_at).toLocaleDateString('vi-VN'),
      'Tổng mặt hàng': r.request_items?.length || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_sach_yeu_cau');
    XLSX.writeFile(wb, `danh_sach_yeu_cau.xlsx`);
  };

  return (
    <div className="space-y-4 w-full">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-slate-900 text-base">Danh sách yêu cầu</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 w-64 bg-white border-slate-200 text-slate-900 text-sm placeholder:text-slate-400"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportExcel}
                className="h-9 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
                    <TableHead className="text-slate-500">Tháng</TableHead>
                    {isAdmin && <TableHead className="text-slate-500">Người yêu cầu</TableHead>}
                    <TableHead className="text-slate-500">Phòng ban</TableHead>
                    <TableHead className="text-slate-500 text-center">Số lượng mặt hàng</TableHead>
                    <TableHead className="text-slate-500">Ngày tạo</TableHead>
                    <TableHead className="text-slate-500 text-right pr-4">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-slate-500 py-8">
                        Không tìm thấy yêu cầu nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((r, idx) => (
                      <TableRow key={r.id} className="border-slate-200 hover:bg-slate-50">
                        <TableCell className="text-slate-500 pl-4 text-sm">{idx + 1}</TableCell>
                        <TableCell className="text-slate-900 font-medium">{r.month}</TableCell>
                        {isAdmin && <TableCell className="text-slate-700">{r.user?.email}</TableCell>}
                        <TableCell>
                          <Badge variant="outline" className="border-slate-200 text-slate-700 bg-white">
                            {r.department?.name || 'Chưa phân'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-slate-700">
                          {r.request_items?.length || 0}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(r.created_at).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(r)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Xóa"
                              >
                                {deletingId === r.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RequestDetailDialog
        request={selectedRequest}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
