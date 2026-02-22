'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { assignGuestToTable } from '@/actions/guests';
import { Badge } from '@/components/ui/badge';
import type { Guest, Table } from '@prisma/client';

type TableWithGuests = Table & { guests: Guest[] };

function TableNode({ table }: { table: TableWithGuests }) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const isOverCapacity = table.guests.length >= table.capacity;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute flex min-h-[120px] w-[180px] flex-col rounded-lg border-2 bg-card p-3 shadow-md transition-colors',
        isOver && 'border-primary bg-primary/5',
        isOverCapacity && 'border-red-500',
        !isOver && !isOverCapacity && 'border-border'
      )}
      style={{ left: table.x, top: table.y }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">{table.name}</span>
        <Badge variant={isOverCapacity ? 'destructive' : 'outline'}>
          {table.guests.length}/{table.capacity}
        </Badge>
      </div>
      <div className="flex-1 space-y-1">
        {table.guests.map((guest) => (
          <DraggableGuest key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  );
}

function DraggableGuest({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab rounded bg-muted px-2 py-1 text-xs transition-shadow hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
    >
      {guest.firstName} {guest.lastName}
    </div>
  );
}

export function SeatingCanvas({
  tables,
  unseatedGuests,
}: {
  tables: TableWithGuests[];
  unseatedGuests: Guest[];
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const guestId = active.id as string;
    const tableId = over.id as string;

    if (tableId === 'unseated') {
      await assignGuestToTable(guestId, null);
    } else {
      await assignGuestToTable(guestId, tableId);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        {/* Unseated guests panel */}
        <UnseatedPanel guests={unseatedGuests} />

        {/* Canvas */}
        <div className="relative min-h-[600px] flex-1 rounded-lg border bg-muted/30 p-4">
          {tables.map((table) => (
            <TableNode key={table.id} table={table} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function UnseatedPanel({ guests }: { guests: Guest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated' });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-48 shrink-0 rounded-lg border bg-card p-3',
        isOver && 'border-primary bg-primary/5'
      )}
    >
      <h3 className="mb-3 text-sm font-semibold">Unseated ({guests.length})</h3>
      <div className="space-y-1">
        {guests.map((guest) => (
          <DraggableGuest key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  );
}
