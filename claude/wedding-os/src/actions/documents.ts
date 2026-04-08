'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';
import { unlink } from 'fs/promises';
import path from 'path';

export async function deleteDocument(id: string) {
  const session = await requireCouple();

  const doc = await prisma.document.findFirst({
    where: { id, weddingId: session.user.weddingId },
  });

  if (!doc) return;

  // Delete the physical file if it's a local upload
  if (doc.url.startsWith('/uploads/')) {
    try {
      await unlink(path.join(process.cwd(), 'public', doc.url));
    } catch {}
  }

  await prisma.document.delete({ where: { id } });
  revalidatePath('/dashboard/documents');
}

export async function updateDocumentNotes(id: string, notes: string) {
  const session = await requireCouple();

  await prisma.document.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { notes },
  });

  revalidatePath('/dashboard/documents');
}
