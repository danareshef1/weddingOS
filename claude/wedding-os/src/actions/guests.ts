'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { guestSchema, type GuestInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function createGuest(data: GuestInput) {
  const session = await requireCouple();
  const parsed = guestSchema.parse(data);

  const guest = await prisma.guest.create({
    data: {
      weddingId: session.user.weddingId,
      ...parsed,
      email: parsed.email || null,
      tags: parsed.tags || [],
    },
  });

  revalidatePath('/dashboard/guests');
  return guest;
}

export async function updateGuest(id: string, data: Partial<GuestInput>) {
  const session = await requireCouple();

  const guest = await prisma.guest.findFirst({
    where: { id, weddingId: session.user.weddingId },
  });

  if (!guest) throw new Error('Guest not found');

  const updated = await prisma.guest.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
    },
  });

  revalidatePath('/dashboard/guests');
  return updated;
}

export async function deleteGuest(id: string) {
  const session = await requireCouple();

  await prisma.guest.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/guests');
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  const session = await requireCouple();

  await prisma.guest.updateMany({
    where: { id: guestId, weddingId: session.user.weddingId },
    data: { tableId },
  });

  revalidatePath('/dashboard/seating');
}
