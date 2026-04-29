import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { GiftsTable } from '@/components/dashboard/gifts-table';

export default async function GiftsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
  const weddingId = session.user.weddingId!;

  // Fetch accepted guests + already-linked gift entries
  const [acceptedGuests, linkedEntries] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId, rsvpStatus: 'ACCEPTED' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, guestType: true, guestCount: true },
    }),
    prisma.giftEntry.findMany({
      where: { weddingId, guestId: { not: null } },
      select: { guestId: true },
    }),
  ]);

  // Auto-create entries for any accepted guest not yet in the gifts table
  const alreadyLinked = new Set(linkedEntries.map((e) => e.guestId));
  const toCreate = acceptedGuests.filter((g) => !alreadyLinked.has(g.id));

  if (toCreate.length > 0) {
    await prisma.giftEntry.createMany({
      data: toCreate.map((g) => ({
        weddingId,
        guestId: g.id,
        guestName: g.guestType === 'FAMILY' ? g.lastName : `${g.firstName} ${g.lastName}`.trim(),
        attendeeCount: (g as any).guestCount ?? 1,
        amount: 0,
        method: 'CASH' as const,
        status: 'PENDING' as const,
      })),
    });
  }

  // Fetch all entries (now up to date)
  const entries = await prisma.giftEntry.findMany({
    where: { weddingId },
    orderBy: [{ guestId: 'desc' }, { guestName: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t('gifts')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('giftsSubtitle')}</p>
      </div>
      <GiftsTable
        initialEntries={entries as any}
        locale={locale}
      />
    </div>
  );
}
