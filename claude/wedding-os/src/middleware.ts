import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';
import { auth } from './lib/auth';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Routes that don't require authentication
const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/verify', '/rsvp', '/guest'];
// Routes that don't require onboarding
const preOnboardingPaths = [...publicPaths, '/onboarding'];

function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply i18n first to get locale-prefixed URL
  const intlResponse = intlMiddleware(request);

  // Determine the path without locale prefix
  const resolvedPathname = intlResponse?.headers?.get('x-middleware-rewrite')
    ? new URL(intlResponse.headers.get('x-middleware-rewrite')!).pathname
    : pathname;
  const pathWithoutLocale = stripLocale(resolvedPathname || pathname);

  // Detect the locale from the URL
  let detectedLocale = defaultLocale;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      detectedLocale = locale;
      break;
    }
  }

  const session = request.auth;

  // 1. Not logged in → redirect to login (unless already on a public path)
  if (!session?.user) {
    const isPublic = publicPaths.some((p) =>
      p === '/' ? pathWithoutLocale === '/' : pathWithoutLocale.startsWith(p)
    );
    if (isPublic) {
      return intlResponse;
    }
    const loginUrl = new URL(`/${detectedLocale}/auth/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Logged in but onboarding not complete → redirect to onboarding
  if (!session.user.onboardingComplete) {
    if (preOnboardingPaths.some((p) => pathWithoutLocale.startsWith(p))) {
      return intlResponse;
    }
    const onboardingUrl = new URL(`/${detectedLocale}/onboarding`, request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // 3. Logged in + onboarding complete but visiting auth/onboarding pages → redirect home
  if (
    pathWithoutLocale.startsWith('/auth/login') ||
    pathWithoutLocale.startsWith('/auth/register') ||
    pathWithoutLocale.startsWith('/onboarding')
  ) {
    return NextResponse.redirect(new URL(`/${detectedLocale}/`, request.url));
  }

  return intlResponse;
});

export const config = {
  matcher: ['/((?!api|_next|uploads|.*\\..*).*)'],
};
