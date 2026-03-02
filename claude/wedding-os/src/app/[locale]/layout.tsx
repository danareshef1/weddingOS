import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n';
import { Providers } from '@/components/providers';
import { PublicShell } from '@/components/layout/public-shell';
import { SetDocumentDirection } from '@/components/set-document-direction';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <Providers>
      <NextIntlClientProvider messages={messages}>
        <SetDocumentDirection locale={locale} />
        <PublicShell>{children}</PublicShell>
      </NextIntlClientProvider>
    </Providers>
  );
}
