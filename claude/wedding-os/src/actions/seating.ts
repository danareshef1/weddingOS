'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { tableSchema, type TableInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function createTable(data: TableInput) {
  const session = await requireCouple();
  const parsed = tableSchema.parse(data);

  const table = await prisma.table.create({
    data: {
      weddingId: session.user.weddingId,
      ...parsed,
    },
  });

  revalidatePath('/dashboard/seating');
  return table;
}

export async function updateTable(id: string, data: Partial<TableInput>) {
  const session = await requireCouple();

  await prisma.table.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data,
  });

  revalidatePath('/dashboard/seating');
}

export async function deleteTable(id: string) {
  const session = await requireCouple();

  // Unassign guest seats and legacy guest tableId
  await Promise.all([
    prisma.guestSeat.updateMany({
      where: { tableId: id, weddingId: session.user.weddingId },
      data: { tableId: null },
    }),
    prisma.guest.updateMany({
      where: { tableId: id, weddingId: session.user.weddingId },
      data: { tableId: null },
    }),
  ]);

  await prisma.table.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/seating');
}

export async function assignSeatToTable(seatId: string, tableId: string | null) {
  const session = await requireCouple();

  const seat = await prisma.guestSeat.findFirst({
    where: { id: seatId, weddingId: session.user.weddingId },
    select: { guestId: true, seatIndex: true },
  });
  if (!seat) throw new Error('Seat not found');

  await prisma.guestSeat.update({ where: { id: seatId }, data: { tableId } });

  // Keep Guest.tableId synced for the primary seat (used by guest-table view)
  if (seat.seatIndex === 0) {
    await prisma.guest.update({ where: { id: seat.guestId }, data: { tableId } });
  }
}

export async function moveTable(id: string, x: number, y: number) {
  const session = await requireCouple();

  await prisma.table.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { x, y },
  });
}

export async function updateSeatingBackground(url: string | null) {
  const session = await requireCouple();

  await prisma.wedding.update({
    where: { id: session.user.weddingId! },
    data: { seatingBackground: url } as any,
  });

  revalidatePath('/dashboard/seating');
}
