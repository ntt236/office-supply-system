'use client';

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
import type { Request } from '@/types';
import { cn } from '@/lib/utils';

interface RequestDetailDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Chi tiết yêu cầu tháng {request.month}</DialogTitle>
          <DialogDescription className="text-slate-400 space-y-1 pt-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Người yêu cầu: </span>
                <span className="text-slate-200 font-medium">{request.user?.email}</span>
              </div>
              <div>
                <span className="text-slate-500">Phòng ban: </span>
                <span className="text-slate-200 font-medium">{request.department?.name || 'Chưa phân'}</span>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo: </span>
                <span className="text-slate-200 font-medium">
                  {new Date(request.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border rounded-md border-slate-700/50 bg-slate-800/50 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-800/90 backdrop-blur-sm z-10">
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400 pl-4 w-12">STT</TableHead>
                <TableHead className="text-slate-400">Mặt hàng</TableHead>
                <TableHead className="text-slate-400">Mã</TableHead>
                <TableHead className="text-slate-400">ĐVT</TableHead>
                <TableHead className="text-slate-400 text-right">Định mức</TableHead>
                <TableHead className="text-slate-400 text-right">Tồn kho</TableHead>
                <TableHead className="text-slate-400 text-right">Yêu cầu</TableHead>
                <TableHead className="text-slate-400 text-right">Mua</TableHead>
                <TableHead className="text-slate-400 text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {request.request_items?.map((item, idx) => {
                const isExceeded = item.item?.default_limit !== null && item.requested > (item.item?.default_limit || 0);
                
                return (
                  <TableRow 
                    key={item.id} 
                    className={cn(
                      "border-slate-700/50 hover:bg-slate-700/30",
                      isExceeded && "bg-red-500/5"
                    )}
                  >
                    <TableCell className="text-slate-400 pl-4 text-sm">{idx + 1}</TableCell>
                    <TableCell className="text-white font-medium">{item.item?.name}</TableCell>
                    <TableCell className="text-slate-400 text-sm font-mono">{item.item?.code}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{item.item?.unit || '—'}</TableCell>
                    <TableCell className="text-slate-400 text-sm text-right">
                      {item.item?.default_limit ?? '—'}
                    </TableCell>
                    <TableCell className="text-slate-300 text-right">{item.stock}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      isExceeded ? "text-red-400" : "text-white"
                    )}>
                      {item.requested}
                    </TableCell>
                    <TableCell className="text-blue-400 text-right font-bold">{item.purchase}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isExceeded
                            ? 'border-red-500/50 text-red-400 bg-red-500/10'
                            : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                        )}
                      >
                        {isExceeded ? 'Vượt' : 'OK'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
