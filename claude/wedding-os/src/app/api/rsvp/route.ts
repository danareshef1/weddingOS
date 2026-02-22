import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rsvpSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { success: rateLimitOk } = rateLimit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { inviteCode, firstName, lastName, email, phone, rsvpStatus, mealChoice, allergies, plusOneName, plusOneMeal, songRequest } = parsed.data;

    // Validate invite code
    const code = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!code) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite code expired' }, { status: 400 });
    }

    if (code.maxUses > 0 && code.uses >= code.maxUses) {
      return NextResponse.json({ error: 'Invite code max uses reached' }, { status: 400 });
    }

    // Create or update guest
    const guest = await prisma.guest.create({
      data: {
        weddingId: code.weddingId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        rsvpStatus: rsvpStatus as 'ACCEPTED' | 'DECLINED',
        mealChoice: mealChoice || null,
        allergies: allergies || null,
        plusOneName: plusOneName || null,
        plusOneMeal: plusOneMeal || null,
        songRequest: songRequest || null,
        inviteCode,
        respondedAt: new Date(),
      },
    });

    // Increment invite code uses
    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { uses: { increment: 1 } },
    });

    return NextResponse.json({ success: true, guestId: guest.id });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
