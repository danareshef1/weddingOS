import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/home/hero-section';

export default async function HomePage() {
  const wedding = await prisma.wedding.findFirst({
    orderBy: { createdAt: 'desc' },
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
