'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/our-story`, label: t('ourStory') },
    { href: `/${locale}/details`, label: t('details') },
    { href: `/${locale}/rsvp`, label: t('rsvp') },
    { href: `/${locale}/gallery`, label: t('gallery') },
    { href: `/${locale}/faq`, label: t('faq') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  const otherLocale = locale === 'he' ? 'en' : 'he';
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="font-serif text-xl font-bold text-primary">
          WeddingOS
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                pathname === link.href && 'bg-accent font-medium'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link href={switchLocalePath} className="ml-2">
            <Button variant="ghost" size="icon">
              <Globe className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/${locale}/auth/login`}>
            <Button variant="outline" size="sm">
              {t('login')}
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                    pathname === link.href && 'bg-accent font-medium'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                <Link href={switchLocalePath} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    {otherLocale === 'he' ? 'עברית' : 'English'}
                  </Button>
                </Link>
                <Link href={`/${locale}/auth/login`} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm">
                    {t('login')}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
