import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';

export default async function GuestInfoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const wedding = await prisma.wedding.findUnique({
    where: { id: session.user.weddingId! },
    include: {
      scheduleItems: { orderBy: { order: 'asc' } },
    },
  });

  if (!wedding) redirect(`/${locale}`);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
        <h1 className="mb-8 text-center font-serif text-3xl font-bold">Event Information</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {wedding.date
                  ? new Date(wedding.date).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'TBA'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Venue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{wedding.venue || 'TBA'}</p>
            </CardContent>
          </Card>

          {wedding.scheduleItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wedding.scheduleItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {item.time}
                      </span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </main>
  );
}
