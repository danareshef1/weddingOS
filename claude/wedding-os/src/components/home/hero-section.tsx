'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FloatingPetals } from './floating-petals';
import { Countdown } from './countdown';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
}

export function HeroSection({ partner1Name, partner2Name, weddingDate }: HeroSectionProps) {
  const t = useTranslations('home');
  const params = useParams();
  const locale = params.locale as string;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600">
      <FloatingPetals />

      {/* Parallax background layers */}
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

      <div className="relative z-20 flex flex-col items-center gap-8 px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-lg tracking-widest text-white/80 sm:text-xl"
        >
          {t('saveTheDate')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-5xl font-bold text-white sm:text-7xl lg:text-8xl"
        >
          {partner1Name} & {partner2Name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-white/90 sm:text-2xl"
        >
          {t('wereGettingMarried')}
        </motion.p>

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
          className="flex gap-4"
        >
          <Link href={`/${locale}/rsvp`}>
            <Button size="lg" className="bg-white text-pink-600 hover:bg-white/90">
              {t('rsvpNow')}
            </Button>
          </Link>
          <Link href={`/${locale}/details`}>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
              {t('viewDetails')}
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
