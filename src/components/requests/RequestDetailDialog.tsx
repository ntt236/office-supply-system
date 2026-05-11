'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import type { Request } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Loader2, X } from 'lucide-react';

interface RequestDetailDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  onStatusUpdate?: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
}

export function RequestDetailDialog({ request, open, onOpenChange, isAdmin, onStatusUpdate }: RequestDetailDialogProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    if (!onStatusUpdate) return;
    setProcessing(true);
    try {
      await onStatusUpdate(request.id, 'approved');
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onStatusUpdate) return;
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (!rejectReason.trim()) return;

    setProcessing(true);
    try {
      await onStatusUpdate(request.id, 'rejected', rejectReason);
      setRejectReason('');
      setShowRejectInput(false);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-900 text-xl">Chi tiết yêu cầu tháng {request.month}</DialogTitle>
            <div className="pr-8">
              {request.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Đã duyệt</Badge>}
              {request.status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Từ chối</Badge>}
              {(!request.status || request.status === 'pending') && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Chờ duyệt</Badge>}
            </div>
          </div>
          <DialogDescription asChild className="text-slate-500 space-y-1 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Người yêu cầu: </span>
                <span className="text-slate-900 font-medium">{request.user?.email}</span>
              </div>
              <div>
                <span className="text-slate-500">Phòng ban: </span>
                <span className="text-slate-900 font-medium">{request.department?.name || 'Chưa phân'}</span>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo: </span>
                <span className="text-slate-900 font-medium">
                  {new Date(request.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
              {request.status === 'rejected' && request.reject_reason && (
                <div className="col-span-2 text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                  <span className="font-semibold">Lý do từ chối: </span>
                  {request.reject_reason}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border rounded-md border-slate-200 bg-white max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500 pl-4 w-12">STT</TableHead>
                <TableHead className="text-slate-500">Mặt hàng</TableHead>
                <TableHead className="text-slate-500">Mã</TableHead>
                <TableHead className="text-slate-500">ĐVT</TableHead>
                <TableHead className="text-slate-500 text-right">Định mức</TableHead>
                <TableHead className="text-slate-500 text-right">Tồn kho</TableHead>
                <TableHead className="text-slate-500 text-right">Yêu cầu</TableHead>
                <TableHead className="text-slate-500 text-right">Cần mua</TableHead>
                <TableHead className="text-slate-500 text-center">Trạng thái</TableHead>
                <TableHead className="text-slate-500 max-w-[200px]">Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.request_items?.map((item, idx) => {
                const isExceeded = item.item?.default_limit !== null && item.requested > (item.item?.default_limit || 0);
                
                return (
                  <TableRow 
                    key={item.id} 
                    className={cn(
                      "border-slate-200 hover:bg-slate-50",
                      isExceeded && "bg-red-50"
                    )}
                  >
                    <TableCell className="text-slate-500 pl-4 text-sm">{idx + 1}</TableCell>
                    <TableCell className="text-slate-900 font-medium">{item.item?.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm font-mono">{item.item?.code}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{item.item?.unit || '—'}</TableCell>
                    <TableCell className="text-slate-500 text-sm text-right">
                      {item.item?.default_limit ?? '—'}
                    </TableCell>
                    <TableCell className="text-slate-700 text-right">{item.stock}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      isExceeded ? "text-red-600" : "text-slate-900"
                    )}>
                      {item.requested}
                    </TableCell>
                    <TableCell className="text-blue-600 text-right font-bold">{item.purchase}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs border-none',
                          isExceeded
                            ? 'text-red-700 bg-red-100'
                            : 'text-emerald-700 bg-emerald-100'
                        )}
                      >
                        {isExceeded ? 'Vượt' : 'OK'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm whitespace-pre-wrap min-w-[200px]" title={item.note || ''}>
                      {item.note || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {isAdmin && (!request.status || request.status === 'pending') && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
            {showRejectInput ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <Input 
                  placeholder="Nhập lý do từ chối..." 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectInput(false)}
                  disabled={processing}
                >
                  Hủy
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận từ chối'}
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={processing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Duyệt yêu cầu
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
