import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.weddingId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, locale } = await req.json();
  const weddingId = session.user.weddingId;

  const [wedding, guests, budgetItems, vendors, todos] = await Promise.all([
    prisma.wedding.findUnique({ where: { id: weddingId } }),
    prisma.guest.findMany({
      where: { weddingId },
      select: { rsvpStatus: true, group: true, mealChoice: true, tableId: true },
    }),
    prisma.budgetItem.findMany({
      where: { weddingId },
      select: { category: true, estimated: true, actual: true, paid: true },
    }),
    prisma.vendor.findMany({
      where: { weddingId },
      select: { name: true, category: true, status: true, amountPaid: true, remainingBalance: true },
    }),
    prisma.todoItem.findMany({
      where: { weddingId },
      select: { title: true, status: true },
    }),
  ]);

  const accepted = guests.filter((g) => g.rsvpStatus === 'ACCEPTED').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'DECLINED').length;
  const pending = guests.filter((g) => g.rsvpStatus === 'PENDING').length;
  const seated = guests.filter((g) => g.tableId !== null).length;

  const totalBudget = budgetItems.reduce((s, b) => s + b.estimated, 0);
  const totalPaid = budgetItems.reduce((s, b) => s + b.paid, 0);

  const vendorsByStatus = vendors.reduce<Record<string, string[]>>((acc, v) => {
    (acc[v.status] = acc[v.status] ?? []).push(v.name);
    return acc;
  }, {});

  const openTodos = todos.filter((t) => t.status !== 'done');

  const dateStr = wedding?.date
    ? wedding.date.toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : (locale === 'he' ? 'לא הוגדר' : 'Not set');

  const systemPrompt = `You are a warm, knowledgeable AI wedding planner assistant embedded in WeddingOS. You have access to the couple's real wedding data and give personalized, actionable advice — not generic responses.

=== WEDDING DETAILS ===
Couple: ${wedding?.partner1Name ?? '?'} & ${wedding?.partner2Name ?? '?'}
Date: ${dateStr}
Venue: ${wedding?.venue ?? (locale === 'he' ? 'לא הוגדר' : 'Not set')}

=== GUESTS (${guests.length} total) ===
Accepted: ${accepted} | Declined: ${declined} | Pending: ${pending}
Seated: ${seated} of ${accepted} accepted guests

=== BUDGET ===
Total estimated: ₪${totalBudget.toLocaleString()}
Total paid so far: ₪${totalPaid.toLocaleString()}
Categories: ${budgetItems.map((b) => `${b.category} (est. ₪${b.estimated.toLocaleString()}, paid ₪${b.paid.toLocaleString()})`).join(' | ') || (locale === 'he' ? 'אין פריטים' : 'none')}

=== VENDORS (${vendors.length} total) ===
${Object.entries(vendorsByStatus).map(([status, names]) => `${status}: ${names.join(', ')}`).join('\n') || (locale === 'he' ? 'אין ספקים' : 'None added yet')}

=== OPEN TO-DO ITEMS (${openTodos.length}) ===
${openTodos.slice(0, 15).map((t) => `• [${t.status}] ${t.title}`).join('\n') || (locale === 'he' ? 'אין משימות פתוחות' : 'None')}

=== INSTRUCTIONS ===
${locale === 'he'
  ? 'ענה תמיד בעברית. השתמש ב-₪ למטבע. היה חם, תומך ומעשי. תן עצות ספציפיות המבוססות על הנתונים האמיתיים של הזוג.'
  : 'Always respond in English. Use ₪ for currency. Be warm, supportive and practical. Give specific advice based on the couple\'s real data above.'}`;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
