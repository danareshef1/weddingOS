'use server';

import { prisma } from '@/lib/prisma';
import { rsvpSchema } from '@/lib/validations';

export async function submitRsvp(formData: FormData) {
  const raw = {
    inviteCode: formData.get('inviteCode') as string,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    rsvpStatus: formData.get('rsvpStatus') as string,
    mealChoice: formData.get('mealChoice') as string,
    allergies: formData.get('allergies') as string,
    plusOneName: formData.get('plusOneName') as string,
    plusOneMeal: formData.get('plusOneMeal') as string,
    songRequest: formData.get('songRequest') as string,
  };

  const parsed = rsvpSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data' };
  }

  const code = await prisma.inviteCode.findUnique({
    where: { code: parsed.data.inviteCode },
  });

  if (!code) {
    return { success: false, error: 'Invalid invite code' };
  }

  if (code.expiresAt && code.expiresAt < new Date()) {
    return { success: false, error: 'Invite code expired' };
  }

  try {
    await prisma.guest.create({
      data: {
        weddingId: code.weddingId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        rsvpStatus: parsed.data.rsvpStatus as 'ACCEPTED' | 'DECLINED',
        mealChoice: parsed.data.mealChoice || null,
        allergies: parsed.data.allergies || null,
        plusOneName: parsed.data.plusOneName || null,
        plusOneMeal: parsed.data.plusOneMeal || null,
        songRequest: parsed.data.songRequest || null,
        inviteCode: parsed.data.inviteCode,
        respondedAt: new Date(),
      },
    });

    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { uses: { increment: 1 } },
    });

    return { success: true };
  } catch (error) {
    console.error('RSVP submit error:', error);
    return { success: false, error: 'Failed to submit RSVP' };
  }
}
