import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { VendorList } from '@/components/dashboard/vendor-list';
import { AddVendorDialog } from '@/components/dashboard/add-vendor-dialog';
import { initializeDefaultVendors } from '@/actions/vendors';

export default async function VendorsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user?.weddingId) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');
  const weddingId = session.user.weddingId;

  const count = await prisma.vendor.count({ where: { weddingId } });
  if (count === 0) {
    await initializeDefaultVendors(weddingId);
  }

  const vendors = await prisma.vendor.findMany({
    where: { weddingId },
    orderBy: { category: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{t('vendors')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('vendorsCount', { count: vendors.length })}</p>
        </div>
        <AddVendorDialog />
      </div>
      <VendorList vendors={vendors} />
    </div>
  );
}
