'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  Send,
  BarChart3,
  Settings,
  LogOut,
  Mail,
  Zap,
  ShieldAlert,
  UserCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <aside className="sidebar">
      {/* Logo - Hidden on mobile */}
      <Link href="/dashboard" className="hidden lg:flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div className="hidden xl:block">
          <h1 className="text-lg font-bold text-surface-100 leading-tight">MailCraft</h1>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary-400" />
            <span className="text-[10px] text-surface-500 uppercase tracking-widest">Pro</span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col lg:gap-1 flex-1 lg:overflow-y-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
        {session?.user?.role === 'admin' && (
          <Link
            href="/dashboard/admin"
            title="Admin Panel"
            className={`sidebar-link ${pathname.startsWith('/dashboard/admin') ? 'active' : ''}`}
          >
            <ShieldAlert className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden lg:inline">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* New Campaign CTA - Hidden on mobile, shown on tablet+ */}
      <Link
        href="/dashboard/campaigns/new"
        className="btn btn-primary w-full mb-4 hidden lg:flex"
      >
        <Send className="w-4 h-4" />
        <span className="hidden xl:inline">New Campaign</span>
      </Link>

      {/* Mobile Campaign Button */}
      <Link
        href="/dashboard/campaigns/new"
        className="btn btn-primary lg:hidden p-2 flex items-center justify-center flex-shrink-0"
        title="New Campaign"
      >
        <Send className="w-4 h-4" />
      </Link>

      {/* Mobile User Info - Compact */}
      <div className="lg:hidden flex items-center gap-2 px-1 flex-shrink-0 min-w-0">
        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {session?.user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="hidden sm:flex flex-col min-w-0">
          <p className="text-xs font-medium text-surface-200 truncate">
            {session?.user?.name?.split(' ')[0] || 'User'}
          </p>
          <p className="text-[10px] text-surface-500 truncate">
            {session?.user?.email?.split('@')[0] || ''}
          </p>
        </div>
      </div>

      {/* User & Log Out */}
      <div className="hidden lg:flex border-t border-surface-800 pt-4 flex-col gap-3">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-surface-500 truncate">
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="sidebar-link flex-1 justify-center mt-2 hover:bg-surface-800 p-2"
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="sidebar-link text-danger hover:bg-danger/10 hover:text-danger flex-1 justify-center mt-2 p-2"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Mobile User Controls - Shown below nav on mobile */}
      <div className="lg:hidden flex gap-2 mt-auto pt-2 border-t border-surface-800">
        <button
          onClick={toggleTheme}
          className="sidebar-link flex-1 justify-center p-2 hover:bg-surface-800"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="sidebar-link text-danger hover:bg-danger/10 hover:text-danger flex-1 justify-center p-2"
          title="Log Out"
          aria-label="Log Out"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </aside>
  );
}
