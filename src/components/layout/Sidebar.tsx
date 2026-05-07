'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  PlusCircle,
  Building2,
  Users,
  Package2,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, adminOnly: true },
  { href: '/requests/new', label: 'Tạo yêu cầu', icon: PlusCircle },
  { href: '/requests', label: 'Danh sách yêu cầu', icon: ClipboardList },
  { href: '/admin/departments', label: 'Phòng ban', icon: Building2, adminOnly: true },
  { href: '/admin/items', label: 'Văn phòng phẩm', icon: Package, adminOnly: true },
  { href: '/admin/users', label: 'Người dùng', icon: Users, adminOnly: true },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">Office Supplies</p>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Quản trị
          </p>
        )}
        {visibleItems.filter(i => i.adminOnly).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isAdmin && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-4">
            Yêu cầu
          </p>
        )}
        {visibleItems.filter(i => !i.adminOnly).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* {isAdmin && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-4">
              Danh mục
            </p>
            {navItems.filter(i => i.adminOnly && i.href.startsWith('/admin')).map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )} */}
      </nav>

      {/* User info footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/requests' && !pathname.includes('/new'));
  const exactActive = pathname === item.href;
  const active = item.href === '/requests' ? exactActive || pathname === '/requests' : isActive;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
        active
          ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      )}
    >
      <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight className="w-3 h-3 text-blue-600" />}
    </Link>
  );
}
