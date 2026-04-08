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

export async function updateVenueBudget(data: {
  venuePricePerPerson: number;
  venueMinGuests: number;
  venueReservePrice: number;
  venueExtraHourPrice: number;
  venueExtraPersons: number;
  venueExtraHours: number;
}) {
  const session = await requireCouple();

  await prisma.wedding.update({
    where: { id: session.user.weddingId },
    data: {
      venuePricePerPerson: data.venuePricePerPerson,
      venueMinGuests: data.venueMinGuests,
      venueReservePrice: data.venueReservePrice,
      venueExtraHourPrice: data.venueExtraHourPrice,
      venueExtraPersons: data.venueExtraPersons,
      venueExtraHours: data.venueExtraHours,
    },
  });

  revalidatePath('/dashboard/budget');
}
