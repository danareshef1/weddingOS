'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  Armchair,
  Wallet,
  Store,
  FolderOpen,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Globe,
  Heart,
  CheckSquare,
  BarChart3,
  Sparkles,
  CalendarClock,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DashboardSidebar() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [collapsed, setCollapsed] = useState(false);

  const otherLocale = locale === 'he' ? 'en' : 'he';
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const links = [
    { href: `/${locale}/dashboard`, label: t('overview'), icon: LayoutDashboard },
    { href: `/${locale}/dashboard/guests`, label: t('guests'), icon: Users },
    { href: `/${locale}/dashboard/seating`, label: t('seating'), icon: Armchair },
    { href: `/${locale}/dashboard/budget`, label: t('budget'), icon: Wallet },
    { href: `/${locale}/dashboard/budget-forecast`, label: t('budgetForecast'), icon: BarChart3 },
    { href: `/${locale}/dashboard/vendors`, label: t('vendors'), icon: Store },
    { href: `/${locale}/dashboard/documents`, label: t('documents'), icon: FolderOpen },
    { href: `/${locale}/dashboard/todos`, label: t('todos'), icon: CheckSquare },
    { href: `/${locale}/dashboard/messages`, label: t('messages'), icon: MessageSquare },
    { href: `/${locale}/dashboard/ai-planner`, label: t('aiPlanner'), icon: Sparkles },
    { href: `/${locale}/dashboard/schedule`, label: t('schedule'), icon: CalendarClock },
    { href: `/${locale}/dashboard/settings`, label: t('settings'), icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-e bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo + collapse */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <span className="font-serif text-base font-bold text-gray-900">WeddingOS</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 shrink-0 text-gray-400 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Home link */}
      <div className="border-b px-3 py-2">
        <Link
          href={`/${locale}`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? tNav('home') : undefined}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{tNav('home')}</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== `/${locale}/dashboard` && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-rose-50 font-medium text-rose-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-rose-600')} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="space-y-0.5 border-t px-3 py-3">
        <Link
          href={switchLocalePath}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? (otherLocale === 'he' ? 'עברית' : 'English') : undefined}
        >
          <Globe className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{otherLocale === 'he' ? 'עברית' : 'English'}</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
