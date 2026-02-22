'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';

export async function addGalleryImage(data: {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}) {
  const session = await requireCouple();

  const image = await prisma.galleryImage.create({
    data: {
      weddingId: session.user.weddingId,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || null,
      caption: data.caption || null,
      uploadedBy: session.user.id,
      approved: true, // Auto-approve when uploaded by couple
    },
  });

  revalidatePath('/dashboard/gallery');
  return image;
}

export async function approveImage(id: string) {
  const session = await requireCouple();

  await prisma.galleryImage.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { approved: true },
  });

  revalidatePath('/dashboard/gallery');
}

export async function rejectImage(id: string) {
  const session = await requireCouple();

  await prisma.galleryImage.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/gallery');
}

export async function toggleImageVisibility(id: string, isPublic: boolean) {
  const session = await requireCouple();

  await prisma.galleryImage.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { public: isPublic },
  });

  revalidatePath('/dashboard/gallery');
}
