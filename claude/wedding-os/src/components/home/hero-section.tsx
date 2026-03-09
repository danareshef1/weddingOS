'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FloatingPetals } from './floating-petals';
import { Countdown } from './countdown';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarHeart, LayoutDashboard, Heart } from 'lucide-react';

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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50 via-rose-50/40 to-white" />
        <div className="absolute start-0 top-0 h-[700px] w-[700px] -translate-x-1/3 -translate-y-1/4 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-100/20 blur-3xl" />
        <div className="absolute end-0 top-1/4 h-[500px] w-[500px] translate-x-1/4 rounded-full bg-gradient-to-bl from-amber-100/30 to-rose-100/15 blur-3xl" />
        <div className="absolute bottom-0 start-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-gradient-to-t from-violet-100/15 to-transparent blur-3xl" />

        <FloatingPetals />

        <div className="relative z-20 flex flex-col items-center gap-0 px-4 text-center">
          {/* Save the date badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-white/80 px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-rose-500 shadow-sm backdrop-blur-sm sm:text-sm">
              <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
              {t('saveTheDate')}
            </span>
          </motion.div>

          {/* Names */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-8 font-serif text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-7xl lg:text-8xl"
          >
            {partner1Name}
            <span className="mx-3 text-rose-300 sm:mx-4">&</span>
            {partner2Name}
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-6 h-px w-24 bg-gradient-to-r from-transparent via-rose-300 to-transparent sm:w-32"
          />

          {/* Venue & Date */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:gap-6"
          >
            {venue && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500 sm:text-base">
                <MapPin className="h-4 w-4 text-rose-400" />
                {venue}
              </span>
            )}
            <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />
            <span className="flex items-center gap-1.5 text-sm text-gray-500 sm:text-base">
              <CalendarHeart className="h-4 w-4 text-rose-400" />
              {formattedDate}
            </span>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-10 sm:mt-12"
          >
            <Countdown targetDate={weddingDate} />
          </motion.div>

          {/* Dashboard CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-10"
          >
            <Link href={`/${locale}/dashboard`}>
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full bg-gray-900 px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/15 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/20 sm:text-base"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('enterDashboard')}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 start-0 end-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>
    </div>
  );
}
