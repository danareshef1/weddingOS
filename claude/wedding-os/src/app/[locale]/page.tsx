import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/home/hero-section';
import { LandingPage } from '@/components/home/landing-page';

export default async function HomePage() {
  const session = await auth();

  // Logged-in users see the couple's wedding hero
  if (session?.user?.weddingId) {
    const wedding = await prisma.wedding.findFirst({
      where: { id: session.user.weddingId },
    });

    return (
      <main>
        <HeroSection
          partner1Name={wedding?.partner1Name || 'Partner 1'}
          partner2Name={wedding?.partner2Name || 'Partner 2'}
          weddingDate={wedding?.date?.toISOString() || new Date('2026-09-15').toISOString()}
          venue={wedding?.venue || ''}
        />
      </main>
    );
  }

  // Not logged in — show the intro landing page
  return (
    <main>
      <LandingPage />
    </main>
  );
}
