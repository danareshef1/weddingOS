'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { weddingSettingsSchema, type WeddingSettingsInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function updateWeddingSettings(data: WeddingSettingsInput) {
  const session = await requireCouple();
  const parsed = weddingSettingsSchema.parse(data);

  await prisma.wedding.update({
    where: { id: session.user.weddingId },
    data: {
      ...parsed,
      date: parsed.date ? new Date(parsed.date) : undefined,
    },
  });

  revalidatePath('/dashboard/settings');
}
