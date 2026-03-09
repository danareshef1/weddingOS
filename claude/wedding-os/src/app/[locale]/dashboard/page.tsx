import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RsvpChart } from '@/components/dashboard/rsvp-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const weddingId = session.user.weddingId!;

  const [guests, budgetItems] = await Promise.all([
    prisma.guest.findMany({ where: { weddingId } }),
    prisma.budgetItem.findMany({ where: { weddingId } }),
  ]);

  const accepted = guests.filter((g) => g.rsvpStatus === 'ACCEPTED').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'DECLINED').length;
  const pending = guests.filter((g) => g.rsvpStatus === 'PENDING').length;

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual, 0);
  const totalPaid = budgetItems.reduce((sum, item) => sum + item.paid, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">Dashboard</h1>

      <StatsCards
        total={guests.length}
        accepted={accepted}
        declined={declined}
        pending={pending}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RSVP Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpChart accepted={accepted} declined={declined} pending={pending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-bold">
                  {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(totalBudget)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-bold text-green-600">
                  {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold text-yellow-600">
                  {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(totalActual - totalPaid)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${totalActual > 0 ? (totalPaid / totalActual) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
