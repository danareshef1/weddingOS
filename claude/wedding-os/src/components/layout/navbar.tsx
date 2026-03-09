'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Globe, LayoutDashboard, LogOut, Heart } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <span className="font-serif text-lg font-bold text-gray-900">WeddingOS</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href={switchLocalePath}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900">
              <Globe className="h-4 w-4" />
              <span className="text-xs">{otherLocale === 'he' ? 'עברית' : 'English'}</span>
            </Button>
          </Link>
          {session ? (
            <>
              <Link href={`/${locale}/dashboard`}>
                <Button size="sm" className="gap-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('dashboard')}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-gray-500 hover:text-gray-900"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  {t('login')}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`}>
                <Button size="sm" className="rounded-full bg-gray-900 text-white hover:bg-gray-800">
                  {t('signUp')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
