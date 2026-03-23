import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approveImage, rejectImage } from '@/actions/gallery';
import { Check, X } from 'lucide-react';

export default async function DashboardGalleryPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');

  const images = await prisma.galleryImage.findMany({
    where: { weddingId: session.user.weddingId! },
    orderBy: { createdAt: 'desc' },
  });

  const pendingImages = images.filter((i) => !i.approved);
  const approvedImages = images.filter((i) => i.approved);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('galleryManagement')}</h1>

      {pendingImages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('pendingApproval')} ({pendingImages.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingImages.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4">
                  <div className="relative mb-3 aspect-video overflow-hidden rounded-md">
                    <Image src={image.url} alt={image.caption || ''} fill className="object-cover" />
                  </div>
                  {image.caption && <p className="mb-2 text-sm">{image.caption}</p>}
                  <div className="flex gap-2">
                    <form action={async () => { 'use server'; await approveImage(image.id); }}>
                      <Button type="submit" size="sm" variant="outline">
                        <Check className="me-1 h-4 w-4" /> {t('approve')}
                      </Button>
                    </form>
                    <form action={async () => { 'use server'; await rejectImage(image.id); }}>
                      <Button type="submit" size="sm" variant="destructive">
                        <X className="me-1 h-4 w-4" /> {t('reject')}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('approved')} ({approvedImages.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {approvedImages.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={image.url} alt={image.caption || ''} fill className="object-cover" />
              <div className="absolute bottom-2 start-2">
                <Badge variant={image.public ? 'success' : 'secondary'}>
                  {image.public ? t('public') : t('private')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {approvedImages.length === 0 && (
          <p className="text-muted-foreground">{t('noApprovedImages')}</p>
        )}
      </div>
    </div>
  );
}
