'use client';

import { motion } from 'framer-motion';
import { Heart, Star, Home, Diamond } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  iconType: string | null;
  order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  star: Star,
  home: Home,
  ring: Diamond,
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Vertical line */}
      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-primary/20" />

      {events.map((event, index) => {
        const Icon = iconMap[event.iconType || 'heart'] || Heart;
        const isLeft = index % 2 === 0;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative mb-12 flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
          >
            {/* Content */}
            <div className={`w-5/12 ${isLeft ? 'text-end' : 'text-start'}`}>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="font-serif text-lg font-semibold">{event.title}</h3>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                )}
                <p className="mt-2 text-xs text-primary">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>

            {/* Icon */}
            <div className="z-10 flex w-2/12 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <Icon className="h-5 w-5" />
              </div>
            </div>

            {/* Spacer */}
            <div className="w-5/12" />
          </motion.div>
        );
      })}
    </div>
  );
}
