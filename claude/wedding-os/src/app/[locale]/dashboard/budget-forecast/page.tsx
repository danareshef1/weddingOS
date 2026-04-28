import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ForecastView } from '@/components/dashboard/forecast-view';

export default async function BudgetForecastPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
  const weddingId = session.user.weddingId!;

  const boards = await prisma.forecastBoard.findMany({
    where: { weddingId },
    orderBy: { createdAt: 'asc' },
    include: {
      items: { orderBy: { createdAt: 'asc' } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{t('budgetForecast')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('budgetForecastSubtitle')}</p>
      </div>

      <ForecastView
        boards={boards.map((b) => ({
          id: b.id,
          name: b.name,
          items: b.items.map((i) => ({
            id: i.id,
            name: i.name,
            isVenue: i.isVenue,
            cost: i.cost,
            pricePerGuest: i.pricePerGuest,
            numGuests: i.numGuests,
          })),
        }))}
      />
    </div>
  );
}
