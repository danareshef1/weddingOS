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

  // Fetch all accepted guests to ensure GuestSeat records exist
  const acceptedGuests = await prisma.guest.findMany({
    where: { weddingId, rsvpStatus: 'ACCEPTED' },
    select: { id: true, guestCount: true },
  });

  // Auto-create missing seat records (idempotent — @@unique prevents duplicates)
  if (acceptedGuests.length > 0) {
    await prisma.guestSeat.createMany({
      data: acceptedGuests.flatMap((g) =>
        Array.from({ length: Math.max(1, g.guestCount ?? 1) }, (_, i) => ({
          weddingId,
          guestId: g.id,
          seatIndex: i,
        }))
      ),
      skipDuplicates: true,
    });
  }

  const seatInclude = {
    include: {
      guest: {
        select: {
          id: true,
          guestType: true,
          firstName: true,
          lastName: true,
          group: true,
        },
      },
    },
    orderBy: [{ seatIndex: 'asc' as const }],
  };

  const [tables, unseatedSeats, wedding] = await Promise.all([
    prisma.table.findMany({
      where: { weddingId },
      include: { guestSeats: seatInclude },
      orderBy: { name: 'asc' },
    }),
    prisma.guestSeat.findMany({
      where: { weddingId, tableId: null },
      include: {
        guest: {
          select: { id: true, guestType: true, firstName: true, lastName: true, group: true },
        },
      },
      orderBy: [{ guest: { group: 'asc' } }, { guest: { lastName: 'asc' } }, { seatIndex: 'asc' }],
    }),
    prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('seatingPlan')}</h1>

      <SeatingCanvas
        initialTables={tables as any}
        initialUnseated={unseatedSeats as any}
        background={(wedding as any).seatingBackground ?? null}
      />
    </div>
  );
}
