import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BudgetTable } from '@/components/dashboard/budget-table';
import { BudgetChart } from '@/components/dashboard/budget-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BudgetPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const items = await prisma.budgetItem.findMany({
    where: { weddingId: session.user.weddingId },
    orderBy: { category: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">Budget</h1>

      <Card>
        <CardHeader>
          <CardTitle>Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetChart items={items} />
        </CardContent>
      </Card>

      <BudgetTable items={items} />
    </div>
  );
}
