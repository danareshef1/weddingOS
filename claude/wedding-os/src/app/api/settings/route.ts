import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.weddingId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user, wedding] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    }),
    prisma.wedding.findUnique({
      where: { id: session.user.weddingId },
      select: { partner1Name: true, partner2Name: true, date: true, venue: true, locale: true },
    }),
  ]);

  return NextResponse.json({ user, wedding });
}
