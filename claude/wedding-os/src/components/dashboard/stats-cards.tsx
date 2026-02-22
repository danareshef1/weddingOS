'use client';

import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardsProps {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
}

export function StatsCards({ total, accepted, declined, pending }: StatsCardsProps) {
  const cards = [
    { label: 'Total Guests', value: total, icon: Users, color: 'text-blue-600' },
    { label: 'Accepted', value: accepted, icon: UserCheck, color: 'text-green-600' },
    { label: 'Declined', value: declined, icon: UserX, color: 'text-red-600' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600' },
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
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
