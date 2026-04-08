import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.weddingId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docs = await prisma.document.findMany({
    where: { weddingId: session.user.weddingId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(docs);
}
