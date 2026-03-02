import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
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

  const weddingId = session.user.weddingId;

  // Auto-initialize default vendor checklist on first visit
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
        <h1 className="font-serif text-3xl font-bold">Vendors</h1>
        <AddVendorDialog />
      </div>
      <VendorList vendors={vendors} />
    </div>
  );
}
