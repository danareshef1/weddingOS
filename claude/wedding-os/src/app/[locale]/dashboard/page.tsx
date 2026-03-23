import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RsvpChart } from '@/components/dashboard/rsvp-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
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
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('weddingAtAGlance')}</p>
      </div>

      <StatsCards
        total={guests.length}
        accepted={accepted}
        declined={declined}
        pending={pending}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">{t('rsvpOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpChart accepted={accepted} declined={declined} pending={pending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">{t('budgetSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('totalBudgetLabel')}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(totalActual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('totalPaid')}</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('remaining')}</span>
                <span className="font-semibold text-amber-600">{formatCurrency(totalActual - totalPaid)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
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
