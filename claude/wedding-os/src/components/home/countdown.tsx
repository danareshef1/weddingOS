'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

interface CountdownProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: CountdownProps) {
  const t = useTranslations('home');
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }

    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const blocks = [
    { value: timeLeft.days, label: t('daysToGo') },
    { value: timeLeft.hours, label: t('hours') },
    { value: timeLeft.minutes, label: t('minutes') },
    { value: timeLeft.seconds, label: t('seconds') },
  ];

  return (
    // Force LTR so numbers always flow left-to-right regardless of locale
    <div dir="ltr" className="flex gap-3 sm:gap-4">
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex flex-col items-center"
        >
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-gray-200/60 bg-white/80 shadow-lg shadow-gray-200/40 backdrop-blur-sm sm:h-[88px] sm:w-[88px]">
            <span className="font-serif text-3xl font-bold tabular-nums text-gray-900 sm:text-4xl">
              {block.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-[10px] font-medium tracking-wider uppercase text-gray-400 sm:text-xs">
            {block.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
