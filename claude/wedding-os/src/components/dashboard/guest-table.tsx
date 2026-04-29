'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Search, User, Users } from 'lucide-react';
import { deleteGuest } from '@/actions/guests';
import { cn } from '@/lib/utils';
import type { Guest, Table } from '@prisma/client';

type GuestWithTable = Guest & { table: Table | null };

const statusColors = {
  ACCEPTED: 'success' as const,
  DECLINED: 'destructive' as const,
  PENDING: 'warning' as const,
  MAYBE: 'warning' as const,
};

function displayName(guest: Guest) {
  if (guest.guestType === 'FAMILY') return guest.lastName;
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ');
}

export function GuestTable({ guests }: { guests: GuestWithTable[] }) {
  const t = useTranslations('dashboard');
  const [search, setSearch] = useState('');

  const filtered = guests.filter((g) => {
    const name = displayName(g).toLowerCase();
    const q = search.toLowerCase();
    return (
      name.includes(q) ||
      g.phone?.toLowerCase().includes(q) ||
      g.group?.toLowerCase().includes(q)
    );
  });

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
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('guestCount')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('phone')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('group')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('rsvpStatus')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('table')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((guest) => {
              const isFamily = guest.guestType === 'FAMILY';
              return (
                <tr key={guest.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          isFamily ? 'bg-violet-100' : 'bg-rose-50',
                        )}
                      >
                        {isFamily
                          ? <Users className="h-3.5 w-3.5 text-violet-500" />
                          : <User className="h-3.5 w-3.5 text-rose-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{displayName(guest)}</p>
                        {!isFamily && guest.firstName && guest.lastName && (
                          <span className="text-[11px] text-gray-400">{t('individualGuest')}</span>
                        )}
                        {isFamily && (
                          <span className="text-[11px] text-violet-400">{t('familyGroup')}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                      {(guest as any).guestCount ?? 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{guest.phone || '-'}</td>
                  <td className="px-4 py-3.5">
                    {guest.group && <Badge variant="outline" className="font-normal">{guest.group}</Badge>}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusColors[guest.rsvpStatus]}>{guest.rsvpStatus}</Badge>
                  </td>
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
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="p-12 text-center text-sm text-gray-400">{t('noGuestsFound')}</p>
        )}
      </div>
    </div>
  );
}
