'use client';

import { useEffect } from 'react';

export function SetDocumentDirection({ locale }: { locale: string }) {
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  // Inline script to set dir/lang immediately (avoids flash of wrong direction)
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${locale}";document.documentElement.dir="${dir}";`,
      }}
    />
  );
}
