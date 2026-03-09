'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-100 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-gray-400 sm:px-6">
        <p className="flex items-center gap-1.5">
          {t('madeWithLove')} <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
        </p>
        <p>&copy; {new Date().getFullYear()} WeddingOS</p>
      </div>
    </footer>
  );
}
