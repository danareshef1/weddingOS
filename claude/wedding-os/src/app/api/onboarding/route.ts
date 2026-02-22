import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { onboardingSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { brideName, groomName, venue, weddingDate } = parsed.data;

    const baseSlug = `${brideName}-and-${groomName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

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

    return NextResponse.json({
      success: true,
      weddingId: wedding.id,
      email: session.user.email,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Failed to create wedding' }, { status: 500 });
  }
}
