'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function updateAccountInfo(data: { name: string; email: string }) {
  const session = await requireCouple();

  // Check email not taken by another user
  if (data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: 'emailTaken' };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name, email: data.email },
  });

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await requireCouple();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) return { error: 'noPassword' };

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) return { error: 'wrongPassword' };

  const hash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return { success: true };
}

export async function updateWeddingDetails(data: {
  partner1Name: string;
  partner2Name: string;
  date: string;
  venue: string;
}) {
  const session = await requireCouple();

  await prisma.wedding.update({
    where: { id: session.user.weddingId },
    data: {
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      date: data.date ? new Date(data.date) : null,
      venue: data.venue || null,
    },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateLanguagePreference(locale: string) {
  const session = await requireCouple();

  await prisma.wedding.update({
    where: { id: session.user.weddingId },
    data: { locale },
  });

  revalidatePath('/dashboard/settings');
  return { success: true };
}
