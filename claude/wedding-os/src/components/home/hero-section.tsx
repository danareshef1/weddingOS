'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FloatingPetals } from './floating-petals';
import { Countdown } from './countdown';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarHeart, LayoutDashboard } from 'lucide-react';

interface HeroSectionProps {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  venue: string;
}

export function HeroSection({ partner1Name, partner2Name, weddingDate, venue }: HeroSectionProps) {
  const t = useTranslations('home');
  const params = useParams();
  const locale = params.locale as string;

  const formattedDate = new Date(weddingDate).toLocaleDateString(
    locale === 'he' ? 'he-IL' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600">
      <FloatingPetals />

      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

      <div className="relative z-20 flex flex-col items-center gap-6 px-4 text-center sm:gap-8">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-base tracking-[0.2em] uppercase text-white/70 sm:text-lg"
        >
          {t('saveTheDate')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-5xl font-bold text-white drop-shadow-lg sm:text-7xl lg:text-8xl"
        >
          {partner1Name} & {partner2Name}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6"
        >
          {venue && (
            <span className="flex items-center gap-1.5 text-base text-white/90 sm:text-lg">
              <MapPin className="h-4 w-4" />
              {venue}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-base text-white/90 sm:text-lg">
            <CalendarHeart className="h-4 w-4" />
            {formattedDate}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Countdown targetDate={weddingDate} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Link href={`/${locale}/dashboard`}>
            <Button size="lg" className="gap-2 bg-white text-pink-600 shadow-lg hover:bg-white/90">
              <LayoutDashboard className="h-5 w-5" />
              {t('enterDashboard')}
            </Button>
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
