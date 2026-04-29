import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ScheduleTimeline } from '@/components/dashboard/schedule-timeline';

export default async function SchedulePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
  const weddingId = session.user.weddingId!;

  const [items, vendors, wedding] = await Promise.all([
    prisma.scheduleItem.findMany({
      where: { weddingId },
      include: { vendor: true },
      orderBy: [{ order: 'asc' }, { time: 'asc' }],
    }),
    prisma.vendor.findMany({
      where: { weddingId },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, category: true,
        phone: true, email: true, amountPaid: true, remainingBalance: true,
      },
    }),
    prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { date: true, partner1Name: true, partner2Name: true },
    }),
  ]);

  const coupleNames = [wedding?.partner1Name, wedding?.partner2Name].filter(Boolean).join(' & ') || 'The Couple';

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('schedule')}</h1>
      <ScheduleTimeline
        initialItems={items as any}
        vendors={vendors}
        weddingDate={wedding?.date ?? null}
        coupleNames={coupleNames}
        locale={locale}
      />
    </div>
  );
}
