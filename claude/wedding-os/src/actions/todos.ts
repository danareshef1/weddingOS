'use server';

import { prisma } from '@/lib/prisma';
import { requireCouple } from '@/lib/auth-middleware';
import { revalidatePath } from 'next/cache';

export async function createTodo(title: string) {
  const session = await requireCouple();

  return prisma.todoItem.create({
    data: { weddingId: session.user.weddingId, title },
  });
}

export async function updateTodoStatus(id: string, status: string) {
  const session = await requireCouple();

  await prisma.todoItem.updateMany({
    where: { id, weddingId: session.user.weddingId },
    data: { status },
  });

  revalidatePath('/dashboard/todos');
}

export async function deleteTodo(id: string) {
  const session = await requireCouple();

  await prisma.todoItem.deleteMany({
    where: { id, weddingId: session.user.weddingId },
  });

  revalidatePath('/dashboard/todos');
}
