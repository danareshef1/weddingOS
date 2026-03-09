import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GuestTable } from '@/components/dashboard/guest-table';
import { CsvImport } from '@/components/dashboard/csv-import';
import { AddGuestDialog } from '@/components/dashboard/add-guest-dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default async function GuestsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const guests = await prisma.guest.findMany({
    where: { weddingId: session.user.weddingId! },
    include: { table: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Guests</h1>
          <p className="mt-1 text-sm text-gray-500">{guests.length} guests total</p>
        </div>
        <div className="flex gap-2">
          <AddGuestDialog />
          <CsvImport />
          <Button variant="outline" size="sm" asChild>
            <a href="/api/guests/export">
              <Download className="me-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <GuestTable guests={guests} />
    </div>
  );
}
