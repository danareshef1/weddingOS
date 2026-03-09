'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Users,
  Wallet,
  Store,
  Globe,
  ArrowRight,
  Heart,
  Sparkles,
  CheckCircle2,
  LayoutDashboard,
  CalendarHeart,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export function LandingPage() {
  const t = useTranslations('home');
  const params = useParams();
  const locale = params.locale as string;

  const features = [
    {
      icon: Users,
      title: t('featureGuests'),
      desc: t('featureGuestsDesc'),
      gradient: 'from-rose-100 to-pink-50',
      iconColor: 'text-rose-500',
    },
    {
      icon: Wallet,
      title: t('featureBudget'),
      desc: t('featureBudgetDesc'),
      gradient: 'from-amber-50 to-orange-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: Store,
      title: t('featureVendors'),
      desc: t('featureVendorsDesc'),
      gradient: 'from-violet-50 to-purple-50',
      iconColor: 'text-violet-500',
    },
    {
      icon: Globe,
      title: t('featureWebsite'),
      desc: t('featureWebsiteDesc'),
      gradient: 'from-sky-50 to-cyan-50',
      iconColor: 'text-sky-500',
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[calc(100vh-3.5rem)]">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/80 via-white to-white" />
        <div className="absolute start-0 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-br from-rose-200/40 to-pink-100/30 blur-3xl" />
        <div className="absolute end-0 top-20 h-[500px] w-[500px] translate-x-1/3 rounded-full bg-gradient-to-bl from-amber-100/40 to-rose-100/20 blur-3xl" />
        <div className="absolute bottom-0 start-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-violet-100/20 to-transparent blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pt-32">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-rose-600 shadow-sm backdrop-blur-sm sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t('landingBadge')}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8 max-w-3xl text-center font-serif text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t('landingTitle')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl text-center text-base leading-relaxed text-gray-500 sm:text-lg lg:text-xl"
          >
            {t('landingSubtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link href={`/${locale}/auth/register`}>
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full bg-gray-900 px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 sm:text-base"
              >
                {t('getStarted')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/auth/login`}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full border-gray-200 px-8 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 sm:text-base"
              >
                {t('signIn')}
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-xs text-gray-400 sm:text-sm"
          >
            {t('freeForever')}
          </motion.p>

          {/* Dashboard Preview / Floating Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative mt-16 w-full max-w-4xl sm:mt-20"
          >
            {/* Main card — dashboard mockup */}
            <div className="relative mx-auto rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-2xl shadow-gray-200/50 backdrop-blur-sm sm:p-8">
              {/* Top bar mockup */}
              <div className="mb-5 flex items-center justify-between sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">WeddingOS</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                </div>
              </div>

              {/* Mock stat cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[
                  { label: 'Guests', value: '248', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { label: 'Budget', value: '120K', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Vendors', value: '12', icon: Store, color: 'text-violet-500', bg: 'bg-violet-50' },
                  { label: 'Days Left', value: '86', icon: CalendarHeart, color: 'text-sky-500', bg: 'bg-sky-50' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:p-4"
                  >
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">{stat.value}</p>
                    <p className="text-[11px] text-gray-400 sm:text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Mock progress bar */}
              <div className="mt-4 sm:mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
                  <span>Planning Progress</span>
                  <span>72%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-rose-400 to-pink-500" />
                </div>
              </div>
            </div>

            {/* Floating accent card — top-end */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -end-4 -top-4 z-20 hidden rounded-xl border border-green-100 bg-white px-4 py-3 shadow-lg shadow-green-100/50 sm:block"
            >
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-gray-700">RSVP Confirmed</span>
              </div>
            </motion.div>

            {/* Floating accent card — bottom-start */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-3 -start-4 z-20 hidden rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-lg shadow-amber-100/50 sm:block"
            >
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-gray-700">Budget on track</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="relative border-t border-gray-100 bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="mx-auto max-w-2xl text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              {t('featureSectionTitle')}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-base text-gray-500 sm:text-lg"
            >
              {t('featureSectionSubtitle')}
            </motion.p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-5 sm:grid-cols-2 lg:gap-6"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={i}
                  className="group relative rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 sm:p-8"
                >
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>

                  {/* Subtle hover accent line */}
                  <div className="absolute bottom-0 start-8 end-8 h-[2px] rounded-full bg-gradient-to-r from-rose-200 to-pink-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative overflow-hidden border-t border-gray-100">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50/50 to-amber-50/30" />
        <div className="absolute end-0 top-0 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-[300px] w-[300px] -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-rose-100/50"
            >
              <Heart className="h-7 w-7 text-rose-400" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            >
              {t('readyTitle')}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 max-w-lg text-base text-gray-500 sm:text-lg"
            >
              {t('readySubtitle')}
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-8">
              <Link href={`/${locale}/auth/register`}>
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-gray-900 px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 sm:text-base"
                >
                  {t('getStarted')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
