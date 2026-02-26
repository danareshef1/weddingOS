'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';

const HIDE_SHELL_PATTERNS = ['/dashboard', '/auth', '/onboarding'];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Strip locale prefix (e.g. "/he/dashboard" → "/dashboard")
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
  const hideShell = HIDE_SHELL_PATTERNS.some((p) => pathWithoutLocale.startsWith(p));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
