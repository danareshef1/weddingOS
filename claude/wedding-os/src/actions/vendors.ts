'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { vendorSchema, type VendorInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function createVendor(data: VendorInput) {
  const session = await requireCouple();
  const parsed = vendorSchema.parse(data);

  const vendor = await prisma.vendor.create({
    data: {
      weddingId: session.user.weddingId,
      ...parsed,
      email: parsed.email || null,
      contractUrl: parsed.contractUrl || null,
    },
  });

  revalidatePath('/dashboard/vendors');
  return vendor;
}

export async function updateVendor(id: string, data: Partial<VendorInput>) {
  const session = await requireCouple();

  await prisma.vendor.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: {
      ...data,
      email: data.email || null,
      contractUrl: data.contractUrl || null,
    },
  });

  revalidatePath('/dashboard/vendors');
}

export async function deleteVendor(id: string) {
  const session = await requireCouple();

  await prisma.vendor.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/vendors');
}

const DEFAULT_VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'DJ',
  'Makeup',
  'Hair',
  'Flowers',
  'Dress',
  'Suit',
  'Invitations',
  'Transportation',
  'Cake',
];

export async function initializeDefaultVendors(weddingId: string) {
  await requireCouple();

  const existing = await prisma.vendor.count({ where: { weddingId } });
  if (existing > 0) return;

  await prisma.vendor.createMany({
    data: DEFAULT_VENDOR_CATEGORIES.map((category) => ({
      weddingId,
      name: category,
      category,
      status: 'NOT_STARTED',
      isDefault: true,
    })),
  });

  revalidatePath('/dashboard/vendors');
}

export async function updateVendorStatus(id: string, status: string) {
  const session = await requireCouple();

  await prisma.vendor.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { status },
  });

  revalidatePath('/dashboard/vendors');
}
