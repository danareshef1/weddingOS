'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Search } from 'lucide-react';
import { deleteGuest } from '@/actions/guests';
import type { Guest, Table } from '@prisma/client';

type GuestWithTable = Guest & { table: Table | null };

const statusColors = {
  ACCEPTED: 'success' as const,
  DECLINED: 'destructive' as const,
  PENDING: 'warning' as const,
};

export function GuestTable({ guests }: { guests: GuestWithTable[] }) {
  const t = useTranslations('dashboard');
  const [search, setSearch] = useState('');

  const filtered = guests.filter(
    (g) =>
      g.firstName.toLowerCase().includes(search.toLowerCase()) ||
      g.lastName.toLowerCase().includes(search.toLowerCase()) ||
      g.phone?.toLowerCase().includes(search.toLowerCase()) ||
      g.group?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-10"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80">
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('name')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('phone')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('group')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('rsvpStatus')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('meal')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('table')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((guest) => (
              <tr key={guest.id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900">
                  {guest.firstName} {guest.lastName}
                  {guest.plusOneName && (
                    <span className="block text-xs font-normal text-gray-400">+1: {guest.plusOneName}</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-500">{guest.phone || '-'}</td>
                <td className="px-4 py-3.5">
                  {guest.group && <Badge variant="outline" className="font-normal">{guest.group}</Badge>}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={statusColors[guest.rsvpStatus]}>{guest.rsvpStatus}</Badge>
                </td>
                <td className="px-4 py-3.5 text-gray-500">{guest.mealChoice || '-'}</td>
                <td className="px-4 py-3.5 text-gray-500">{guest.table?.name || '-'}</td>
                <td className="px-4 py-3.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-destructive"
                    onClick={() => deleteGuest(guest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="p-12 text-center text-sm text-gray-400">{t('noGuestsFound')}</p>
        )}
      </div>
    </div>
  );
}
