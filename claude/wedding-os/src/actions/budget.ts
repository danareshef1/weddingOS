'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { budgetItemSchema, type BudgetItemInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function createBudgetItem(data: BudgetItemInput) {
  const session = await requireCouple();
  const parsed = budgetItemSchema.parse(data);

  const item = await prisma.budgetItem.create({
    data: {
      weddingId: session.user.weddingId,
      ...parsed,
      actual: parsed.actual || 0,
      paid: parsed.paid || 0,
      deposit: parsed.deposit || 0,
      paymentMethod: parsed.paymentMethod || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
    },
  });

  revalidatePath('/dashboard/budget');
  return item;
}

export async function updateBudgetItem(id: string, data: Partial<BudgetItemInput>) {
  const session = await requireCouple();

  await prisma.budgetItem.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === '' ? null : undefined,
      notes: data.notes ?? undefined,
    },
  });

  revalidatePath('/dashboard/budget');
}

export async function deleteBudgetItem(id: string) {
  const session = await requireCouple();

  await prisma.budgetItem.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/budget');
}
