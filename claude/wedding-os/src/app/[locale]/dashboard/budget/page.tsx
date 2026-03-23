import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BudgetTable } from '@/components/dashboard/budget-table';
import { BudgetChart } from '@/components/dashboard/budget-chart';
import { AddBudgetDialog } from '@/components/dashboard/add-budget-dialog';
import { VenueBudget } from '@/components/dashboard/venue-budget';
import { computeVenueTotal } from '@/lib/venue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Receipt, CreditCard, PiggyBank } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default async function BudgetPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');

  const weddingId = session.user.weddingId!;

  const [items, wedding] = await Promise.all([
    prisma.budgetItem.findMany({
      where: { weddingId },
      orderBy: { category: 'asc' },
    }),
    prisma.wedding.findUnique({
      where: { id: weddingId },
      select: {
        venuePricePerPerson: true,
        venueMinGuests: true,
        venueReservePrice: true,
        venueExtraHourPrice: true,
        venueExtraPersons: true,
        venueExtraHours: true,
      },
    }),
  ]);

  const venueTotal = computeVenueTotal(wedding);
  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0) + venueTotal;
  const totalActual = items.reduce((s, i) => s + i.actual, 0) + venueTotal;
  const totalPaid = items.reduce((s, i) => s + i.paid, 0);
  const totalDeposits = items.reduce((s, i) => s + i.deposit, 0);

  const summaryCards = [
    { label: t('totalEstimated'), value: totalEstimated, icon: Banknote, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: t('totalActual'), value: totalActual, icon: Receipt, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: t('totalPaid'), value: totalPaid, icon: CreditCard, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: t('totalDeposits'), value: totalDeposits, icon: PiggyBank, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{t('budget')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('itemsTracked', { count: items.length })}</p>
        </div>
        <AddBudgetDialog />
      </div>

      <VenueBudget
        venuePricePerPerson={wedding?.venuePricePerPerson ?? 0}
        venueMinGuests={wedding?.venueMinGuests ?? 0}
        venueReservePrice={wedding?.venueReservePrice ?? 0}
        venueExtraHourPrice={wedding?.venueExtraHourPrice ?? 0}
        venueExtraPersons={wedding?.venueExtraPersons ?? 0}
        venueExtraHours={wedding?.venueExtraHours ?? 0}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold tabular-nums text-gray-900">{formatCurrency(card.value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">{t('budgetByCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetChart items={items} />
        </CardContent>
      </Card>

      <BudgetTable items={items} />
    </div>
  );
}
