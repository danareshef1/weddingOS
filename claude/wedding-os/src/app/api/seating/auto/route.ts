import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user || !['COUPLE', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weddingId = session.user.weddingId!;

  try {
    const [guests, tables] = await Promise.all([
      prisma.guest.findMany({
        where: { weddingId, rsvpStatus: 'ACCEPTED', tableId: null },
        orderBy: [{ group: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.table.findMany({
        where: { weddingId },
        include: { guests: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Greedy assignment: group guests by group tag, then fill tables respecting capacity
    const grouped = new Map<string, typeof guests>();
    for (const guest of guests) {
      const key = guest.group || '__ungrouped__';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(guest);
    }

    let assigned = 0;
    const tableCapacities = tables.map((t) => ({
      id: t.id,
      remaining: t.capacity - t.guests.length,
    }));

    const groupEntries = Array.from(grouped.values());
    for (const groupGuests of groupEntries) {
      for (const guest of groupGuests) {
        // Find table with most remaining capacity
        const bestTable = tableCapacities
          .filter((t) => t.remaining > 0)
          .sort((a, b) => b.remaining - a.remaining)[0];

        if (!bestTable) break;

        await prisma.guest.update({
          where: { id: guest.id },
          data: { tableId: bestTable.id },
        });

        bestTable.remaining--;
        assigned++;
      }
    }

    return NextResponse.json({ success: true, assigned });
  } catch (error) {
    console.error('Auto-seat error:', error);
    return NextResponse.json({ error: 'Failed to auto-seat guests' }, { status: 500 });
  }
}
