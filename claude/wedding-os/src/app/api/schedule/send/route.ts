import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendScheduleEmail } from '@/lib/mailer';

function buildICS(items: { id: string; time: string; duration: number; title: string; description: string | null; location: string | null }[], weddingDate: Date | null): string {
  const base = weddingDate ? new Date(weddingDate) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:.Z]/g, '').slice(0, 15) + 'Z';

  const fmtLocal = (h: number, m: number) =>
    `${base.getFullYear()}${pad(base.getMonth() + 1)}${pad(base.getDate())}T${pad(h)}${pad(m)}00`;

  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//WeddingOS//Wedding Day Schedule//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ];

  for (const item of items) {
    const [h, m] = item.time.split(':').map(Number);
    const endMs = new Date(base).setHours(h, m + item.duration, 0, 0);
    const endD = new Date(endMs);
    const endStr = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}@weddingos.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtLocal(h, m)}`,
      `DTEND:${endStr}`,
      `SUMMARY:${item.title}`,
      ...(item.description ? [`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`] : []),
      ...(item.location ? [`LOCATION:${item.location}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.weddingId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { to, itemIds, message } = await req.json() as { to: string; itemIds?: string[]; message?: string };
  if (!to) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const weddingId = session.user.weddingId;

  const [wedding, allItems] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId }, select: { date: true, partner1Name: true, partner2Name: true } }),
    prisma.scheduleItem.findMany({
      where: { weddingId, ...(itemIds?.length ? { id: { in: itemIds } } : {}) },
      orderBy: [{ order: 'asc' }, { time: 'asc' }],
    }),
  ]);

  if (allItems.length === 0) return NextResponse.json({ error: 'No events to send' }, { status: 400 });

  const coupleNames = `${wedding?.partner1Name ?? ''} & ${wedding?.partner2Name ?? ''}`.trim() || 'The Couple';
  const icsContent = buildICS(allItems, wedding?.date ?? null);

  await sendScheduleEmail({
    to,
    coupleNames,
    eventCount: allItems.length,
    message: message ?? '',
    icsContent,
    icsFilename: `${coupleNames.replace(/[^a-zA-Z0-9]/g, '-')}-wedding-schedule.ics`,
  });

  return NextResponse.json({ ok: true });
}
