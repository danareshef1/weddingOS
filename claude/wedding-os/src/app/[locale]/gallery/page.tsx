import { prisma } from '@/lib/prisma';
import { GalleryGrid } from '@/components/gallery/gallery-grid';

export default async function GalleryPage() {
  const wedding = await prisma.wedding.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const images = wedding
    ? await prisma.galleryImage.findMany({
        where: { weddingId: wedding.id, approved: true, public: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-16 text-center">
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">Gallery</h1>
        <p className="mt-4 text-lg text-muted-foreground">Moments we&apos;ve shared</p>
      </div>
      {images.length > 0 ? (
        <GalleryGrid images={images} />
      ) : (
        <p className="text-center text-muted-foreground">Photos coming soon!</p>
      )}
    </main>
  );
}
