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
      g.email?.toLowerCase().includes(search.toLowerCase()) ||
      g.group?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-10"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-start font-medium">Name</th>
              <th className="px-4 py-3 text-start font-medium">Email</th>
              <th className="px-4 py-3 text-start font-medium">Group</th>
              <th className="px-4 py-3 text-start font-medium">RSVP</th>
              <th className="px-4 py-3 text-start font-medium">Meal</th>
              <th className="px-4 py-3 text-start font-medium">Table</th>
              <th className="px-4 py-3 text-start font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((guest) => (
              <tr key={guest.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">
                  {guest.firstName} {guest.lastName}
                  {guest.plusOneName && (
                    <span className="block text-xs text-muted-foreground">+1: {guest.plusOneName}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{guest.email || '-'}</td>
                <td className="px-4 py-3">
                  {guest.group && <Badge variant="outline">{guest.group}</Badge>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[guest.rsvpStatus]}>{guest.rsvpStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{guest.mealChoice || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{guest.table?.name || '-'}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
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
          <p className="p-8 text-center text-muted-foreground">No guests found</p>
        )}
      </div>
    </div>
  );
}
