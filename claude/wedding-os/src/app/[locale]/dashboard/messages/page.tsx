import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function MessagesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const templates = await prisma.messageTemplate.findMany({
    where: { weddingId: session.user.weddingId! },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">Message Templates</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline">{template.channel}</Badge>
              </div>
              {template.subject && (
                <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{template.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <p className="text-muted-foreground">No message templates yet</p>
      )}
    </div>
  );
}
