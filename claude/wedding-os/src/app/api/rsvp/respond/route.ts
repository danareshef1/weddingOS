import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ANSWER_MAP = {
  yes: 'ACCEPTED',
  no: 'DECLINED',
  maybe: 'MAYBE',
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: token },
      include: { wedding: { select: { partner1Name: true, partner2Name: true } } },
    });

    if (!guest) return NextResponse.json({ error: 'Invalid RSVP link' }, { status: 404 });

    return NextResponse.json({
      guestName: `${guest.firstName} ${guest.lastName}`,
      firstName: guest.firstName,
      currentStatus: guest.rsvpStatus,
      weddingCouple: `${guest.wedding.partner1Name} & ${guest.wedding.partner2Name}`,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, answer } = await request.json();

    if (!token || !answer || !(answer in ANSWER_MAP)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({
      where: { rsvpToken: token },
      include: { wedding: { select: { partner1Name: true, partner2Name: true } } },
    });

    if (!guest) {
      return NextResponse.json({ error: 'Invalid RSVP link' }, { status: 404 });
    }

    const rsvpStatus = ANSWER_MAP[answer as keyof typeof ANSWER_MAP];

    await prisma.guest.update({
      where: { id: guest.id },
      data: { rsvpStatus, respondedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      guestName: `${guest.firstName} ${guest.lastName}`,
      status: rsvpStatus,
      weddingCouple: `${guest.wedding.partner1Name} & ${guest.wedding.partner2Name}`,
    });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
