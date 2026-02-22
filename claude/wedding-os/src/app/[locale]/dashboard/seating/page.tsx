import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SeatingCanvas } from '@/components/dashboard/seating-canvas';
import { Button } from '@/components/ui/button';

export default async function SeatingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const weddingId = session.user.weddingId;

  const [tables, unseatedGuests] = await Promise.all([
    prisma.table.findMany({
      where: { weddingId },
      include: { guests: true },
      orderBy: { name: 'asc' },
    }),
    prisma.guest.findMany({
      where: { weddingId, tableId: null, rsvpStatus: 'ACCEPTED' },
      orderBy: [{ group: 'asc' }, { lastName: 'asc' }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">Seating Plan</h1>
        <form action="/api/seating/auto" method="POST">
          <Button type="submit" variant="outline">
            Auto-Seat Guests
          </Button>
        </form>
      </div>

      <SeatingCanvas tables={tables} unseatedGuests={unseatedGuests} />
    </div>
  );
}
