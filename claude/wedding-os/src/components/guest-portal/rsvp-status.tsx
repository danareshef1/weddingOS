'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Guest } from '@prisma/client';

const statusColors = {
  ACCEPTED: 'success' as const,
  DECLINED: 'destructive' as const,
  PENDING: 'warning' as const,
  MAYBE: 'warning' as const,
};

const statusLabels = {
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  PENDING: 'Pending',
  MAYBE: 'Maybe',
};

export function RsvpStatus({ guest }: { guest: Guest }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your RSVP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{guest.firstName} {guest.lastName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={statusColors[guest.rsvpStatus]}>
            {statusLabels[guest.rsvpStatus]}
          </Badge>
        </div>
        {guest.mealChoice && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Meal Choice</span>
            <span>{guest.mealChoice}</span>
          </div>
        )}
        {guest.allergies && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Allergies</span>
            <span>{guest.allergies}</span>
          </div>
        )}
        {guest.plusOneName && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plus One</span>
            <span>{guest.plusOneName}</span>
          </div>
        )}
        {guest.songRequest && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Song Request</span>
            <span>{guest.songRequest}</span>
          </div>
        )}
        {guest.respondedAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Responded</span>
            <span className="text-sm">
              {new Date(guest.respondedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
