export type UserRole = 'admin' | 'user';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ItemCategory = 'office_supply' | 'janitorial';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string | null;
  department_id: string | null;
  role: UserRole;
  created_at: string;
  department?: Department;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  unit: string | null;
  default_limit: number | null;
  category: ItemCategory;
  created_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  department_id: string;
  month: string;
  status: RequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  created_at: string;
  user?: User;
  department?: Department;
  request_items?: RequestItem[];
}

export interface RequestItem {
  id: string;
  request_id: string;
  item_id: string;
  stock: number;
  requested: number;
  purchase: number;
  note: string | null;
  created_at: string;
  item?: Item;
}

export interface DepartmentItem {
  id: string;
  department_id: string;
  item_id: string;
  created_at: string;
  item?: Item;
}

export interface DashboardMetrics {
  totalRequests: number;
  totalRequestedItems: number;
  exceededRequests: number;
  totalDepartments: number;
}

export interface RequestItemRow {
  item: Item;
  stock: number;
  requested: number;
  purchase: number;
  note: string;
  status: 'OK' | 'EXCEED';
}
