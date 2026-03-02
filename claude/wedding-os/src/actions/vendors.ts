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
      name: parsed.name,
      category: parsed.category,
      phone: parsed.phone || null,
      email: parsed.email || null,
      notes: parsed.notes || null,
      status: parsed.status || 'NOT_STARTED',
      amountPaid: parsed.amountPaid || 0,
      remainingBalance: parsed.remainingBalance || 0,
      paymentDate: parsed.paymentDate ? new Date(parsed.paymentDate) : null,
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
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.amountPaid !== undefined && { amountPaid: data.amountPaid }),
      ...(data.remainingBalance !== undefined && { remainingBalance: data.remainingBalance }),
      ...(data.paymentDate !== undefined && { paymentDate: data.paymentDate ? new Date(data.paymentDate) : null }),
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
