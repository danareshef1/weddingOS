'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';

export type ChecklistItem = { id: string; text: string; done: boolean };

export type ScheduleItemInput = {
  time: string;
  duration?: number;
  title: string;
  description?: string;
  location?: string;
  category?: string;
  vendorId?: string | null;
  checklist?: ChecklistItem[];
  status?: string;
  order?: number;
};

export async function createScheduleItem(data: ScheduleItemInput) {
  const session = await requireCouple();
  const item = await prisma.scheduleItem.create({
    data: {
      weddingId: session.user.weddingId,
      time: data.time,
      duration: data.duration ?? 60,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      category: data.category ?? 'custom',
      vendorId: data.vendorId || null,
      checklist: (data.checklist ?? []) as any,
      status: data.status ?? 'pending',
      order: data.order ?? 0,
    },
    include: { vendor: true },
  });
  revalidatePath('/dashboard/schedule');
  return item;
}

export async function updateScheduleItem(id: string, data: Partial<ScheduleItemInput>) {
  const session = await requireCouple();
  const patch: Record<string, unknown> = {};
  if (data.time !== undefined) patch.time = data.time;
  if (data.duration !== undefined) patch.duration = data.duration;
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.location !== undefined) patch.location = data.location;
  if (data.category !== undefined) patch.category = data.category;
  if ('vendorId' in data) patch.vendorId = data.vendorId || null;
  if (data.checklist !== undefined) patch.checklist = data.checklist;
  if (data.status !== undefined) patch.status = data.status;

  await prisma.scheduleItem.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: patch,
  });
  revalidatePath('/dashboard/schedule');
}

export async function deleteScheduleItem(id: string) {
  const session = await requireCouple();
  await prisma.scheduleItem.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });
  revalidatePath('/dashboard/schedule');
}

export async function reorderScheduleItems(ids: string[]) {
  const session = await requireCouple();
  await Promise.all(
    ids.map((id, order) =>
      prisma.scheduleItem.updateMany({
        where: { id, weddingId: session.user.weddingId },
        data: { order },
      }),
    ),
  );
}
