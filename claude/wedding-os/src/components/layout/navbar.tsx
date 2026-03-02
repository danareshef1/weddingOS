'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Globe, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const { data: session } = useSession();
  const locale = params.locale as string;

  const otherLocale = locale === 'he' ? 'en' : 'he';
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}`} className="font-serif text-lg font-bold text-primary">
          WeddingOS
        </Link>

        <div className="flex items-center gap-2">
          <Link href={switchLocalePath}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Globe className="h-4 w-4" />
              <span className="text-xs">{otherLocale === 'he' ? 'עברית' : 'English'}</span>
            </Button>
          </Link>
          {session ? (
            <>
              <Link href={`/${locale}/dashboard`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('dashboard')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </Button>
            </>
          ) : (
            <Link href={`/${locale}/auth/login`}>
              <Button variant="outline" size="sm">
                {t('login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
