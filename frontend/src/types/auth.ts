// Authentication Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: UserRole;
  role_display?: string;
  status: string;
  job_title?: string;
  department?: string;
  last_login_at?: string;
  permissions: UserPermissions;
  accessible_stores: number[];
  accessible_regions: string[];
}

export type UserRole = 'super_admin' | 'regional_manager' | 'store_manager' | 'analyst';

export interface UserPermissions {
  accessible_stores: number[];
  accessible_regions: string[];
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_manage_users: boolean;
  can_manage_inventory: boolean;
  can_manage_promotions: boolean;
  can_view_financials: boolean;
  can_approve_transfers: boolean;
  can_use_ai_chat?: boolean;
  can_use_voice_chat?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'super_admin': 100,
  'regional_manager': 75,
  'store_manager': 50,
  'analyst': 25
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'super_admin': 'Senior VP',
  'regional_manager': 'Senior Manager',
  'store_manager': 'Store Manager',
  'analyst': 'Analyst'
};

// Permission labels for UI
export const PERMISSION_LABELS: Record<string, string> = {
  can_view: 'View Data',
  can_edit: 'Edit Records',
  can_delete: 'Delete Records',
  can_export: 'Export Data',
  can_manage_users: 'Manage Users',
  can_manage_inventory: 'Manage Inventory',
  can_manage_promotions: 'Manage Promotions',
  can_view_financials: 'View Financials',
  can_approve_transfers: 'Approve Transfers'
};
