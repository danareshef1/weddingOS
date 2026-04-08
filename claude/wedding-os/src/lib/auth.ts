import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      weddingId: string | null;
      onboardingComplete: boolean;
    };
  }

  interface User {
    role: Role;
    weddingId: string | null;
    onboardingComplete: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { wedding: true },
        });

        if (!user || !user.passwordHash) return null;

        if (!user.emailVerified) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          weddingId: user.weddingId,
          onboardingComplete: user.wedding?.onboardingComplete ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.weddingId = user.weddingId;
        token.onboardingComplete = user.onboardingComplete;
      }
      // When update() is called from the client with data, apply it directly
      if (trigger === 'update' && session) {
        if (session.weddingId !== undefined) token.weddingId = session.weddingId;
        if (session.onboardingComplete !== undefined) token.onboardingComplete = session.onboardingComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
        session.user.weddingId = token.weddingId as string | null;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
      }
      return session;
    },
  },
});
