import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SeatingCanvas } from '@/components/dashboard/seating-canvas';

export default async function SeatingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
  const weddingId = session.user.weddingId!;

  const [tables, unseatedGuests, wedding] = await Promise.all([
    prisma.table.findMany({
      where: { weddingId },
      include: { guests: true },
      orderBy: { name: 'asc' },
    }),
    prisma.guest.findMany({
      where: { weddingId, tableId: null, rsvpStatus: 'ACCEPTED' },
      orderBy: [{ group: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.wedding.findUniqueOrThrow({
      where: { id: weddingId },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('seatingPlan')}</h1>

      <SeatingCanvas
        initialTables={tables as any}
        initialUnseated={unseatedGuests}
        background={(wedding as any).seatingBackground ?? null}
      />
    </div>
  );
}
