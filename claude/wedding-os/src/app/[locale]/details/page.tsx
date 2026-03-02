import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Shirt } from 'lucide-react';

export default async function DetailsPage() {
  const wedding = await prisma.wedding.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      scheduleItems: { orderBy: { order: 'asc' } },
    },
  });

  return (
    <main className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Wedding Details</h1>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                When
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {wedding?.date
                  ? new Date(wedding.date).toLocaleDateString('en-US', {
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
                Where
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{wedding?.venue || 'TBA'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="h-5 w-5 text-primary" />
                Dress Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Smart casual. Light colors preferred.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wedding?.scheduleItems.map((item) => (
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
        </div>
    </main>
  );
}
