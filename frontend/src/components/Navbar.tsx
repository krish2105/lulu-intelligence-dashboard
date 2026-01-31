'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronDown,
  User,
  Store,
  Tag,
  FileText,
  Shield,
  Menu,
  X,
  ShoppingBag,
  Activity
} from 'lucide-react';
import { ROLE_DISPLAY_NAMES, UserRole } from '@/types/auth';
import { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: UserRole[];
  permission?: string;
}

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    href: '/', 
    icon: <LayoutDashboard className="w-5 h-5" /> 
  },
  { 
    label: 'Inventory', 
    href: '/inventory', 
    icon: <Package className="w-5 h-5" />,
    permission: 'can_manage_inventory'
  },
  { 
    label: 'Promotions', 
    href: '/promotions', 
    icon: <Tag className="w-5 h-5" />,
    permission: 'can_manage_promotions'
  },
  { 
    label: 'Analytics', 
    href: '/analytics', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
  { 
    label: 'Reports', 
    href: '/reports', 
    icon: <FileText className="w-5 h-5" />,
    permission: 'can_export'
  },
  { 
    label: 'Alerts', 
    href: '/alerts', 
    icon: <Bell className="w-5 h-5" /> 
  },
  { 
    label: 'Admin', 
    href: '/admin', 
    icon: <Shield className="w-5 h-5" />,
    roles: ['super_admin']
  },
  { 
    label: 'Monitoring', 
    href: '/monitoring', 
    icon: <Activity className="w-5 h-5" />,
    permission: 'is_admin'
  }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, hasRole, hasPermission } = useAuth();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(3);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const canAccessItem = (item: NavItem): boolean => {
    if (item.roles && !hasRole(item.roles)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  };

  if (!isAuthenticated) return null;

  const filteredNavItems = navItems.filter(canAccessItem);

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white">Lulu Intelligence</h1>
              <p className="text-xs text-slate-400 -mt-1">UAE Analytics</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  pathname === item.href
                    ? 'bg-slate-700/50 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Alerts Button */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all border border-slate-700/50"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {ROLE_DISPLAY_NAMES[user?.role as UserRole] || user?.role}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 py-2 bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-white">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user?.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                        user?.role === 'regional_manager' ? 'bg-cyan-500/20 text-cyan-400' :
                        user?.role === 'store_manager' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {ROLE_DISPLAY_NAMES[user?.role as UserRole] || user?.role}
                      </span>
                    </div>
                  </div>

                  {/* Accessible Stores Info */}
                  <div className="px-4 py-2 border-b border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">Access Level</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">
                        {user?.role === 'super_admin' 
                          ? 'All Stores' 
                          : `${user?.accessible_stores?.length || 0} store(s)`}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Preferences
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="pt-1 border-t border-slate-700/50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === item.href
                    ? 'bg-slate-700/50 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
