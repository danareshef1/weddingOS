import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function esc(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CHECK: 'Check',
  BANK_TRANSFER: 'Bank Transfer',
  BIT: 'Bit',
  ONLINE: 'Online',
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.weddingId || !['COUPLE', 'ADMIN'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const entries = await prisma.giftEntry.findMany({
    where: { weddingId: session.user.weddingId },
    orderBy: [{ status: 'asc' }, { guestName: 'asc' }],
  });

  const headers = ['Guest Name', 'Attendees', 'Amount (₪)', 'Payment Method', 'Status', 'Notes', 'Received At'];
  const rows = entries.map((e) => [
    esc(e.guestName),
    esc(e.attendeeCount),
    esc(e.amount),
    esc(METHOD_LABELS[e.method] ?? e.method),
    esc(e.status === 'RECEIVED' ? 'Received' : 'Pending'),
    esc(e.notes),
    esc(e.receivedAt ? new Date(e.receivedAt).toLocaleDateString() : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gifts.csv"',
    },
  });
}
