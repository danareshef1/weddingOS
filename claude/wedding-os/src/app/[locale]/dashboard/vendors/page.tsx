import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VendorList } from '@/components/dashboard/vendor-list';

export default async function VendorsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/auth/login`);

  const vendors = await prisma.vendor.findMany({
    where: { weddingId: session.user.weddingId! },
    orderBy: { category: 'asc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">Vendors</h1>
      <VendorList vendors={vendors} />
    </div>
  );
}
