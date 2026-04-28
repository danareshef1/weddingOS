'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';
import { sendSms, sendWhatsApp, isTwilioConfigured } from '@/lib/twilio';
import { sendRsvpEmail } from '@/lib/mailer';

function generateRsvpToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function buildRsvpLink(token: string, locale: string): string {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${base}/${locale}/rsvp/respond?token=${token}`;
}

function personalizeBody(body: string, guest: { firstName: string; lastName: string }, rsvpLink: string): string {
  return body
    .replace(/\{FIRST_NAME\}/g, guest.firstName)
    .replace(/\{LAST_NAME\}/g, guest.lastName)
    .replace(/\{NAME\}/g, `${guest.firstName} ${guest.lastName}`)
    .replace(/\{RSVP_LINK\}/g, rsvpLink);
}

export async function sendRsvpMessages(body: string, channel: 'SMS' | 'EMAIL' | 'WHATSAPP') {
  const session = await requireCouple();
  const weddingId = session.user.weddingId!;

  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: { locale: true },
  });
  const locale = wedding?.locale ?? 'he';

  // Only guests NOT marked as ACCEPTED
  const guests = await prisma.guest.findMany({
    where: { weddingId, rsvpStatus: { not: 'ACCEPTED' } },
    orderBy: { createdAt: 'asc' },
  });

  if (guests.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  const isDev = process.env.NODE_ENV !== 'production';
  const twilioReady = isTwilioConfigured();

  const messageSend = await prisma.messageSend.create({
    data: { weddingId, body, channel, recipientCount: guests.length },
  });

  let sent = 0;
  let failed = 0;

  for (const guest of guests) {
    // Ensure guest has a unique RSVP token
    let token = guest.rsvpToken;
    if (!token) {
      token = generateRsvpToken();
      await prisma.guest.update({ where: { id: guest.id }, data: { rsvpToken: token } });
    }

    const rsvpLink = buildRsvpLink(token, locale);
    const personalizedBody = personalizeBody(body, guest, rsvpLink);

    let status = 'sent';
    let error: string | undefined;

    try {
      if (channel === 'WHATSAPP') {
        if (!guest.phone) {
          throw new Error('No phone number');
        }
        if (isDev && !twilioReady) {
          console.log(`[WHATSAPP dev] To: ${guest.phone}\n${personalizedBody}`);
        } else {
          await sendWhatsApp(guest.phone, personalizedBody);
        }
      } else if (channel === 'SMS') {
        if (!guest.phone) {
          throw new Error('No phone number');
        }
        if (isDev && !twilioReady) {
          console.log(`[SMS dev] To: ${guest.phone}\n${personalizedBody}`);
        } else {
          await sendSms(guest.phone, personalizedBody);
        }
      } else if (channel === 'EMAIL') {
        if (!guest.email) {
          throw new Error('No email address');
        }
        await sendRsvpEmail(guest.email, `${guest.firstName} ${guest.lastName}`, personalizedBody);
      }

      await prisma.guest.update({
        where: { id: guest.id },
        data: { messageSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : 'Unknown error';
      failed++;
    }

    await prisma.messageLog.create({
      data: { messageSendId: messageSend.id, guestId: guest.id, status, error },
    });
  }

  revalidatePath('/dashboard/messages');
  revalidatePath('/dashboard/guests');

  return { sent, failed };
}

export async function getGuestsWithMessageStatus() {
  const session = await requireCouple();
  return prisma.guest.findMany({
    where: { weddingId: session.user.weddingId! },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      rsvpStatus: true,
      messageSentAt: true,
      respondedAt: true,
    },
  });
}

export async function getMessageHistory() {
  const session = await requireCouple();
  const sends = await prisma.messageSend.findMany({
    where: { weddingId: session.user.weddingId! },
    orderBy: { sentAt: 'desc' },
    take: 10,
    include: { logs: { select: { status: true } } },
  });

  return sends.map((s) => ({
    id: s.id,
    body: s.body,
    channel: s.channel,
    recipientCount: s.recipientCount,
    sentAt: s.sentAt.toISOString(),
    successCount: s.logs.filter((l) => l.status === 'sent').length,
    failedCount: s.logs.filter((l) => l.status === 'failed').length,
  }));
}

export async function updateGuestRsvp(guestId: string, status: 'ACCEPTED' | 'DECLINED' | 'MAYBE' | 'PENDING') {
  const session = await requireCouple();
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId: session.user.weddingId! },
  });
  if (!guest) throw new Error('Guest not found');

  await prisma.guest.update({
    where: { id: guestId },
    data: { rsvpStatus: status, respondedAt: status !== 'PENDING' ? new Date() : null },
  });

  revalidatePath('/dashboard/messages');
  revalidatePath('/dashboard/guests');
  revalidatePath('/dashboard/seating');
}
