import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['COUPLE', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const text = await request.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have header + at least one row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['firstname', 'lastname'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    const guests = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      if (row.firstname && row.lastname) {
        guests.push({
          weddingId: session.user.weddingId!,
          firstName: row.firstname,
          lastName: row.lastname,
          email: row.email || null,
          phone: row.phone || null,
          group: row.group || null,
          tags: row.tags ? row.tags.split(';') : [],
        });
      }
    }

    const result = await prisma.guest.createMany({ data: guests });

    return NextResponse.json({
      success: true,
      imported: result.count,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import guests' }, { status: 500 });
  }
}
