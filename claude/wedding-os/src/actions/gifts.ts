'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';

export type GiftEntryInput = {
  guestId?: string | null;
  guestName: string;
  attendeeCount?: number;
  amount?: number;
  method?: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'BIT' | 'ONLINE';
  status?: 'RECEIVED' | 'PENDING';
  notes?: string;
  receivedAt?: Date | null;
};

export async function createGiftEntry(data: GiftEntryInput) {
  const session = await requireCouple();
  const entry = await prisma.giftEntry.create({
    data: {
      weddingId: session.user.weddingId,
      guestId: data.guestId || null,
      guestName: data.guestName,
      attendeeCount: data.attendeeCount ?? 1,
      amount: data.amount ?? 0,
      method: data.method ?? 'CASH',
      status: data.status ?? 'PENDING',
      notes: data.notes ?? null,
      receivedAt: data.status === 'RECEIVED' ? (data.receivedAt ?? new Date()) : null,
    },
    include: { guest: { select: { id: true, firstName: true, lastName: true } } },
  });
  revalidatePath('/dashboard/gifts');
  return entry;
}

export async function updateGiftEntry(id: string, data: Partial<GiftEntryInput>) {
  const session = await requireCouple();
  const patch: Record<string, unknown> = {};
  if (data.guestName !== undefined) patch.guestName = data.guestName;
  if ('guestId' in data) patch.guestId = data.guestId || null;
  if (data.attendeeCount !== undefined) patch.attendeeCount = data.attendeeCount;
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.method !== undefined) patch.method = data.method;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.status !== undefined) {
    patch.status = data.status;
    if (data.status === 'RECEIVED') patch.receivedAt = new Date();
    if (data.status === 'PENDING') patch.receivedAt = null;
  }
  await prisma.giftEntry.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: patch,
  });
  revalidatePath('/dashboard/gifts');
}

export async function deleteGiftEntry(id: string) {
  const session = await requireCouple();
  await prisma.giftEntry.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });
  revalidatePath('/dashboard/gifts');
}

export async function importGiftsFromGuests() {
  const session = await requireCouple();
  const weddingId = session.user.weddingId;

  const [acceptedGuests, existingEntries] = await Promise.all([
    prisma.guest.findMany({
      where: { weddingId, rsvpStatus: 'ACCEPTED' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.giftEntry.findMany({
      where: { weddingId, guestId: { not: null } },
      select: { guestId: true },
    }),
  ]);

  const alreadyImported = new Set(existingEntries.map((e) => e.guestId));
  const toImport = acceptedGuests.filter((g) => !alreadyImported.has(g.id));

  if (toImport.length === 0) return 0;

  await prisma.giftEntry.createMany({
    data: toImport.map((g) => ({
      weddingId,
      guestId: g.id,
      guestName: g.guestType === 'FAMILY' ? g.lastName : `${g.firstName} ${g.lastName}`.trim(),
      attendeeCount: g.guestCount ?? 1,
      amount: 0,
      method: 'CASH' as const,
      status: 'PENDING' as const,
    })),
  });

  revalidatePath('/dashboard/gifts');
  return toImport.length;
}
