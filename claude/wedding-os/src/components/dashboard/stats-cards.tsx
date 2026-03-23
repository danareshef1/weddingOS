'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
}

export function StatsCards({ total, accepted, declined, pending }: StatsCardsProps) {
  const t = useTranslations('dashboard');

  const cards = [
    { label: t('totalGuests'), value: total, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', accent: 'border-s-blue-400' },
    { label: t('accepted'), value: accepted, icon: UserCheck, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', accent: 'border-s-emerald-400' },
    { label: t('declined'), value: declined, icon: UserX, iconBg: 'bg-rose-50', iconColor: 'text-rose-500', accent: 'border-s-rose-400' },
    { label: t('pending'), value: pending, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', accent: 'border-s-amber-400' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`border-s-4 ${card.accent}`}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
