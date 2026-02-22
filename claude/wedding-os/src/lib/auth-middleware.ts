import { auth } from './auth';
import { Role } from '@prisma/client';

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

export async function requireOnboarded() {
  const session = await requireAuth();

  if (!session.user.weddingId || !session.user.onboardingComplete) {
    throw new Error('Onboarding not complete');
  }

  return session as typeof session & { user: typeof session.user & { weddingId: string } };
}

export async function requireCouple() {
  const session = await requireOnboarded();

  if (!['COUPLE', 'ADMIN'].includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

export async function requireGuest() {
  const session = await requireOnboarded();

  if (!['GUEST', 'COUPLE', 'ADMIN'].includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}
