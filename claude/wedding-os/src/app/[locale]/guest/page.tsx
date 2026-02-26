import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RsvpStatus } from '@/components/guest-portal/rsvp-status';

export default async function GuestPortalPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const guest = await prisma.guest.findFirst({
    where: {
      weddingId: session.user.weddingId!,
      email: session.user.email,
    },
  });

  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-center font-serif text-3xl font-bold">Guest Portal</h1>
      {guest ? (
        <RsvpStatus guest={guest} />
      ) : (
        <p className="text-center text-muted-foreground">
          No RSVP found for your account. Please use the RSVP page to respond.
        </p>
      )}
    </main>
  );
}
