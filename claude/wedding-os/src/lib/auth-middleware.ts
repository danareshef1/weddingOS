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

export async function requireCouple() {
  return requireAuth([Role.COUPLE, Role.ADMIN]);
}

export async function requireGuest() {
  return requireAuth([Role.GUEST, Role.COUPLE, Role.ADMIN]);
}
