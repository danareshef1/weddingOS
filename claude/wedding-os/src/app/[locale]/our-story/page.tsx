import { useTranslations } from 'next-intl';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Timeline } from '@/components/our-story/timeline';

export default async function OurStoryPage() {
  const wedding = await prisma.wedding.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const events = wedding
    ? await prisma.timelineEvent.findMany({
        where: { weddingId: wedding.id },
        orderBy: { order: 'asc' },
      })
    : [];

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Our Story</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The journey that brought us together
          </p>
        </div>
        <Timeline events={events} />
      </main>
      <Footer />
    </>
  );
}
