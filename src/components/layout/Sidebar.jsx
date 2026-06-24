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
  X,
  Briefcase,
  Award,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send },
  { href: '/dashboard/ats-checker', label: 'ATS Checker', icon: Award },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTimeout(() => setTheme(savedTheme), 0);
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

  // Close mobile drawer on route transition
  useEffect(() => {
    setTimeout(() => setMobileMenuOpen(false), 0);
  }, [pathname]);

  const initials = session?.user?.name?.[0]?.toUpperCase() || '?';
  const isPremium = session?.user?.plan !== 'free' || session?.user?.role === 'admin';

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR: Shown on screens 1024px (lg) and wider */}
      {/* ========================================================================= */}
      <aside className="sidebar hidden lg:flex">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="hidden xl:block">
            <h1 className="text-lg font-bold text-surface-100 leading-tight">MailCraft</h1>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary-400" />
              <span className="text-[10px] text-surface-500 uppercase tracking-widest">
                {session?.user?.plan || 'Pro'}
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
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
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
          {/* Recruiter Emails: visible to everyone, PRO badge for free users */}
          <Link
            href="/dashboard/recruiter-emails"
            title="Recruiter Emails"
            className={`sidebar-link ${pathname.startsWith('/dashboard/recruiter-emails') ? 'active' : ''}`}
          >
            <Briefcase className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="hidden xl:inline">Recruiter Emails</span>
            {!isPremium && (
              <span className="hidden xl:inline text-[9px] font-bold uppercase tracking-wider bg-warning/20 text-warning px-1.5 py-0.5 rounded ml-auto">
                Pro
              </span>
            )}
          </Link>
          {session?.user?.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              title="Admin Panel"
              className={`sidebar-link ${pathname.startsWith('/dashboard/admin') ? 'active' : ''}`}
            >
              <ShieldAlert className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="hidden xl:inline">Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* New Campaign CTA */}
        <Link
          href="/dashboard/campaigns/new"
          className="btn btn-primary w-full mb-4 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span className="hidden xl:inline">New Campaign</span>
        </Link>

        {/* User profile & controls */}
        <div className="border-t border-surface-800 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 hidden xl:block">
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
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAV BAR: Shown on screens smaller than 1024px */}
      {/* ========================================================================= */}
      <div className="bottom-nav lg:hidden">
        {/* Tab 1: Overview */}
        <Link
          href="/dashboard"
          className={`bottom-nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard className="w-[20px] h-[20px]" />
          <span>Overview</span>
        </Link>

        {/* Tab 2: Templates */}
        <Link
          href="/dashboard/templates"
          className={`bottom-nav-link ${pathname.startsWith('/dashboard/templates') ? 'active' : ''}`}
        >
          <FileText className="w-[20px] h-[20px]" />
          <span>Templates</span>
        </Link>

        {/* Tab 3: Center FAB (New Campaign) */}
        <Link
          href="/dashboard/campaigns/new"
          className="bottom-nav-fab"
          title="New Campaign"
        >
          <Send className="w-[20px] h-[20px] text-white" />
        </Link>

        {/* Tab 4: Campaigns */}
        <Link
          href="/dashboard/campaigns"
          className={`bottom-nav-link ${pathname.startsWith('/dashboard/campaigns') && !pathname.startsWith('/dashboard/campaigns/new') ? 'active' : ''}`}
        >
          <Send className="w-[20px] h-[20px]" />
          <span>Campaigns</span>
        </Link>

        {/* Tab 5: Account Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`bottom-nav-link focus:outline-none ${mobileMenuOpen ? 'active' : ''}`}
        >
          <div className="w-[24px] h-[24px] rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white border border-surface-700">
            {initials}
          </div>
          <span>Account</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MOBILE DRAWER POPOVER & BACKDROP BACKDROP OVERLAY */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <>
          {/* Transparent click-away overlay background */}
          <div className="drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />

          {/* Frosted Glass Slide-up Drawer popup */}
          <div className="mobile-drawer">
            {/* Header: User Profile Details */}
            <div className="flex items-center gap-4 border-b border-surface-850 pb-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold text-white">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-surface-100 truncate">
                    {session?.user?.name || 'User'}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded-full">
                    {session?.user?.plan || 'Free'}
                  </span>
                </div>
                <p className="text-xs text-surface-400 truncate">{session?.user?.email || ''}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-surface-800 rounded-lg text-surface-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Links Grid: Settings & Navigation */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link
                href="/dashboard/profile"
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                  pathname.startsWith('/dashboard/profile')
                    ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                    : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                }`}
              >
                <UserCircle className="w-[18px] h-[18px]" />
                Profile
              </Link>
              <Link
                href="/dashboard/ats-checker"
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                  pathname.startsWith('/dashboard/ats-checker')
                    ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                    : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                }`}
              >
                <Award className="w-[18px] h-[18px]" />
                ATS Checker
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                  pathname.startsWith('/dashboard/analytics')
                    ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                    : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                }`}
              >
                <BarChart3 className="w-[18px] h-[18px]" />
                Analytics
              </Link>
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                  pathname.startsWith('/dashboard/settings')
                    ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                    : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                }`}
              >
                <Settings className="w-[18px] h-[18px]" />
                Settings
              </Link>
              {session?.user?.role === 'admin' && (
                <Link
                  href="/dashboard/admin"
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                    pathname.startsWith('/dashboard/admin')
                      ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                      : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                  }`}
                >
                  <ShieldAlert className="w-[18px] h-[18px]" />
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/recruiter-emails"
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium text-surface-200 transition-all ${
                  pathname.startsWith('/dashboard/recruiter-emails')
                    ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                    : 'border-surface-800 bg-surface-800/40 hover:border-surface-700'
                }`}
              >
                <Briefcase className="w-[18px] h-[18px]" />
                <span>Recruiter Emails</span>
                {!isPremium && (
                  <span className="text-[10px] font-bold uppercase bg-warning/20 text-warning px-2 py-0.5 rounded-full ml-auto">
                    Pro
                  </span>
                )}
              </Link>
            </div>

            {/* Bottom Actions: Theme Selector & Log Out */}
            <div className="flex gap-3">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-surface-800 bg-surface-800/40 text-sm font-medium text-surface-200 hover:border-surface-700 hover:bg-surface-800/60 transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-warning" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-primary-400" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-danger/20 bg-danger/10 text-sm font-medium text-danger hover:bg-danger/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
