'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p className="flex items-center gap-1">
          {t('madeWithLove')} <Heart className="h-4 w-4 fill-primary text-primary" />
        </p>
        <p>&copy; {new Date().getFullYear()} WeddingOS</p>
      </div>
    </footer>
  );
}
