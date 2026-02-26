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
  Image,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DashboardSidebar() {
  const t = useTranslations('dashboard');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { href: `/${locale}/dashboard`, label: t('overview'), icon: LayoutDashboard },
    { href: `/${locale}/dashboard/guests`, label: t('guests'), icon: Users },
    { href: `/${locale}/dashboard/seating`, label: t('seating'), icon: Armchair },
    { href: `/${locale}/dashboard/budget`, label: t('budget'), icon: Wallet },
    { href: `/${locale}/dashboard/vendors`, label: t('vendors'), icon: Store },
    { href: `/${locale}/dashboard/gallery`, label: t('gallery'), icon: Image },
    { href: `/${locale}/dashboard/messages`, label: t('messages'), icon: MessageSquare },
    { href: `/${locale}/dashboard/settings`, label: t('settings'), icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-e bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <h2 className="font-semibold text-primary">{t('title')}</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
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
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                isActive && 'bg-accent font-medium text-primary',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent text-muted-foreground hover:text-foreground',
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
