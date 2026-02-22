'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Trash2 } from 'lucide-react';
import { deleteVendor } from '@/actions/vendors';
import type { Vendor } from '@prisma/client';

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">{vendor.name}</CardTitle>
              <Badge variant="outline" className="mt-1">{vendor.category}</Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteVendor(vendor.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.notes && (
              <p className="text-muted-foreground">{vendor.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
