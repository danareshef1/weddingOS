'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';

// ── Boards ────────────────────────────────────────────────────────────────────

export async function createForecastBoard(name: string) {
  const session = await requireCouple();

  const board = await prisma.forecastBoard.create({
    data: {
      weddingId: session.user.weddingId,
      name: name.trim(),
    },
    include: { items: true },
  });

  revalidatePath('/dashboard/budget-forecast');
  return board;
}

export async function renameForecastBoard(boardId: string, name: string) {
  const session = await requireCouple();

  await prisma.forecastBoard.updateMany({
    where: { id: boardId, weddingId: session.user.weddingId },
    data: { name: name.trim() },
  });

  revalidatePath('/dashboard/budget-forecast');
}

export async function deleteForecastBoard(boardId: string) {
  const session = await requireCouple();

  await prisma.forecastBoard.deleteMany({
    where: { id: boardId, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/budget-forecast');
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function addForecastItem(
  boardId: string,
  data: {
    name: string;
    isVenue: boolean;
    cost?: number;
    pricePerGuest?: number;
    numGuests?: number;
  },
) {
  const session = await requireCouple();

  // Verify board belongs to this wedding
  const board = await prisma.forecastBoard.findFirst({
    where: { id: boardId, weddingId: session.user.weddingId },
  });
  if (!board) throw new Error('Board not found');

  const item = await prisma.forecastItem.create({
    data: {
      boardId,
      name: data.name.trim(),
      isVenue: data.isVenue,
      cost: data.cost ?? 0,
      pricePerGuest: data.pricePerGuest ?? 0,
      numGuests: data.numGuests ?? 0,
    },
  });

  revalidatePath('/dashboard/budget-forecast');
  return item;
}

export async function updateForecastItem(
  itemId: string,
  data: {
    name?: string;
    cost?: number;
    pricePerGuest?: number;
    numGuests?: number;
  },
) {
  const session = await requireCouple();

  // Verify the item belongs to a board owned by this wedding
  const item = await prisma.forecastItem.findFirst({
    where: {
      id: itemId,
      board: { weddingId: session.user.weddingId },
    },
  });
  if (!item) throw new Error('Item not found');

  const updated = await prisma.forecastItem.update({
    where: { id: itemId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.pricePerGuest !== undefined && { pricePerGuest: data.pricePerGuest }),
      ...(data.numGuests !== undefined && { numGuests: data.numGuests }),
    },
  });

  revalidatePath('/dashboard/budget-forecast');
  return updated;
}

export async function deleteForecastItem(itemId: string) {
  const session = await requireCouple();

  const item = await prisma.forecastItem.findFirst({
    where: {
      id: itemId,
      board: { weddingId: session.user.weddingId },
    },
  });
  if (!item) throw new Error('Item not found');

  await prisma.forecastItem.delete({ where: { id: itemId } });

  revalidatePath('/dashboard/budget-forecast');
}
