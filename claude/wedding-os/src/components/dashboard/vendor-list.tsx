'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Mail, Trash2, Banknote, CalendarClock } from 'lucide-react';
import { deleteVendor, updateVendorStatus } from '@/actions/vendors';
import type { Vendor } from '@prisma/client';

const statusVariant: Record<string, 'outline' | 'warning' | 'success'> = {
  NOT_STARTED: 'outline',
  CONTACTED: 'warning',
  BOOKED: 'success',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  const t = useTranslations('dashboard');

  if (vendors.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No vendors yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base leading-tight">{vendor.name}</CardTitle>
              <Badge variant="outline" className="text-xs">{vendor.category}</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => deleteVendor(vendor.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 text-sm">
            <Select
              value={vendor.status}
              onValueChange={(v) => updateVendorStatus(vendor.id, v)}
            >
              <SelectTrigger className="h-8">
                <Badge variant={statusVariant[vendor.status]} className="pointer-events-none">
                  <SelectValue />
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">{t('notStarted')}</SelectItem>
                <SelectItem value="CONTACTED">{t('contacted')}</SelectItem>
                <SelectItem value="BOOKED">{t('booked')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 space-y-1.5">
              {vendor.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
            </div>

            {(vendor.amountPaid > 0 || vendor.remainingBalance > 0) && (
              <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('amountPaid')}</span>
                  <span className="font-medium text-green-700">{formatCurrency(vendor.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('remainingBalance')}</span>
                  <span className="font-medium">{formatCurrency(vendor.remainingBalance)}</span>
                </div>
                {vendor.paymentDate && (
                  <div className="flex items-center gap-1 pt-0.5 text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    <span>{new Date(vendor.paymentDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {vendor.notes && (
              <p className="text-xs text-muted-foreground">{vendor.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
