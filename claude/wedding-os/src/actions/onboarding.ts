'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { onboardingSchema, type OnboardingInput } from '@/lib/validations';

export async function completeOnboarding(data: OnboardingInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data' };
  }

  const { brideName, groomName, venue, weddingDate } = parsed.data;

  // Generate a slug from the names
  const baseSlug = `${brideName}-and-${groomName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  try {
    // Create the wedding and link to user in a transaction
    const wedding = await prisma.$transaction(async (tx) => {
      const wedding = await tx.wedding.create({
        data: {
          slug,
          partner1Name: brideName,
          partner2Name: groomName,
          venue,
          date: new Date(weddingDate),
          onboardingComplete: true,
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { weddingId: wedding.id },
      });

      return wedding;
    });

    return { success: true, weddingId: wedding.id };
  } catch (error) {
    console.error('Onboarding error:', error);
    return { success: false, error: 'Failed to create wedding' };
  }
}
