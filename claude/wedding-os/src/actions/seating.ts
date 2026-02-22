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

  // Unassign guests first
  await prisma.guest.updateMany({
    where: { tableId: id, weddingId: session.user.weddingId },
    data: { tableId: null },
  });

  await prisma.table.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/seating');
}

export async function moveTable(id: string, x: number, y: number) {
  const session = await requireCouple();

  await prisma.table.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { x, y },
  });
}
