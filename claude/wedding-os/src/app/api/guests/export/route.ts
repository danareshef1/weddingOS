import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user || !['COUPLE', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    where: { weddingId: session.user.weddingId! },
    include: { table: true },
    orderBy: { lastName: 'asc' },
  });

  const headers = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'group',
    'rsvpStatus',
    'mealChoice',
    'allergies',
    'plusOneName',
    'table',
    'songRequest',
  ];

  const rows = guests.map((g) =>
    [
      g.firstName,
      g.lastName,
      g.email || '',
      g.phone || '',
      g.group || '',
      g.rsvpStatus,
      g.mealChoice || '',
      g.allergies || '',
      g.plusOneName || '',
      g.table?.name || '',
      g.songRequest || '',
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="guests.csv"',
    },
  });
}
