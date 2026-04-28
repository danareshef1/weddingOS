'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { assignGuestToTable } from '@/actions/guests';
import { createTable, deleteTable, moveTable, updateSeatingBackground } from '@/actions/seating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Trash2, Plus, Upload, ImageOff, X } from 'lucide-react';
import type { Guest, Table } from '@prisma/client';
import { useTranslations } from 'next-intl';

type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE';
type TableWithGuests = Table & { guests: Guest[]; shape: TableShape };

// ─── Dimensions per shape ────────────────────────────────────────────────────
const DIMS: Record<TableShape, { w: number; h: number }> = {
  ROUND: { w: 200, h: 200 },
  SQUARE: { w: 180, h: 180 },
  RECTANGLE: { w: 250, h: 160 },
};

// ─── Seat positions ───────────────────────────────────────────────────────────

function getRoundSeats(n: number, cx: number, cy: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

function getRectSeats(n: number, x1: number, y1: number, x2: number, y2: number) {
  const W = x2 - x1;
  const H = y2 - y1;
  const perim = 2 * (W + H);
  return Array.from({ length: n }, (_, i) => {
    const d = (i / n) * perim;
    if (d < W) return { x: x1 + d, y: y1 };
    if (d < W + H) return { x: x2, y: y1 + (d - W) };
    if (d < 2 * W + H) return { x: x2 - (d - W - H), y: y2 };
    return { x: x1, y: y2 - (d - 2 * W - H) };
  });
}

// ─── Table SVG (shape + seat dots) ───────────────────────────────────────────

function TableSVG({
  shape,
  W,
  H,
  seated,
  capacity,
  isOver,
}: {
  shape: TableShape;
  W: number;
  H: number;
  seated: number;
  capacity: number;
  isOver: boolean;
}) {
  const stroke = isOver ? '#f43f5e' : '#d1d5db';
  const fill = isOver ? '#fff1f2' : '#ffffff';

  if (shape === 'ROUND') {
    const cx = W / 2;
    const cy = H / 2;
    const tableR = Math.min(W, H) / 2 - 22;
    const seatR = tableR + 14;
    const seats = getRoundSeats(capacity, cx, cy, seatR);
    return (
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <circle cx={cx} cy={cy} r={tableR} fill={fill} stroke={stroke} strokeWidth={2.5} />
        {seats.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={7}
            fill={i < seated ? '#f43f5e' : '#e5e7eb'}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </svg>
    );
  }

  const margin = 20;
  const x1 = margin, y1 = margin, x2 = W - margin, y2 = H - margin;
  const seats = getRectSeats(capacity, x1, y1, x2, y2);
  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
    >
      <rect
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={2.5}
      />
      {seats.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={7}
          fill={i < seated ? '#f43f5e' : '#e5e7eb'}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// ─── Guest chip ───────────────────────────────────────────────────────────────

function GuestChip({
  guest,
  onRemove,
}: {
  guest: Guest;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-guest="true"
      className={cn(
        'flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-800 cursor-grab select-none',
        isDragging && 'opacity-40',
      )}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
      }}
    >
      <span className="truncate max-w-[90px]">
        {guest.firstName} {guest.lastName}
      </span>
      {onRemove && (
        <button
          data-action="true"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 hover:text-red-600 transition-colors"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Visual table on canvas ───────────────────────────────────────────────────

function VisualTable({
  table,
  onDelete,
  onRemoveGuest,
}: {
  table: TableWithGuests;
  onDelete: () => void;
  onRemoveGuest: (guestId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const [pos, setPos] = useState({ x: table.x, y: table.y });
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  const { w: W, h: H } = DIMS[table.shape];
  const seated = table.guests.length;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-guest]')) return;
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPos({
      x: Math.max(0, dragRef.current.ox + e.clientX - dragRef.current.sx),
      y: Math.max(0, dragRef.current.oy + e.clientY - dragRef.current.sy),
    });
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    moveTable(table.id, pos.x, pos.y);
  };

  const contentInset = table.shape === 'ROUND' ? 38 : 28;
  const maxGuests = table.shape === 'RECTANGLE' ? 4 : 3;

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{ left: pos.x, top: pos.y, width: W, height: H }}
    >
      <TableSVG
        shape={table.shape}
        W={W}
        H={H}
        seated={seated}
        capacity={table.capacity}
        isOver={isOver}
      />

      {/* Content overlay */}
      <div
        className="absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden pointer-events-none"
        style={{ inset: contentInset }}
      >
        <span className="text-[11px] font-semibold text-gray-700 leading-tight text-center">
          {table.name}
        </span>
        <Badge variant="outline" className="text-[9px] py-0 h-3.5 px-1 pointer-events-none">
          {seated}/{table.capacity}
        </Badge>
        <div className="flex flex-col gap-0.5 w-full items-center mt-0.5 pointer-events-auto">
          {table.guests.slice(0, maxGuests).map((g) => (
            <GuestChip key={g.id} guest={g} onRemove={() => onRemoveGuest(g.id)} />
          ))}
          {table.guests.length > maxGuests && (
            <span className="text-[9px] text-gray-400">
              +{table.guests.length - maxGuests} more
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        data-action="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        className="absolute top-1 right-1 z-10 rounded-full p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Unseated panel ───────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  "Groom's friends",
  "Bride's friends",
  "Groom's family",
  "Bride's family",
  "Groom's parents' friends",
  "Bride's parents' friends",
  "Groom's parents' work",
  "Bride's parents' work",
  "Groom's work",
  "Bride's work",
  "Other",
];

function UnseatedPanel({ guests }: { guests: Guest[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated' });
  const t = useTranslations('dashboard');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = CATEGORY_ORDER.reduce<Record<string, Guest[]>>((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {});
  for (const g of guests) {
    const key = g.group && CATEGORY_ORDER.includes(g.group) ? g.group : 'Other';
    grouped[key].push(g);
  }

  const nonEmptyCategories = CATEGORY_ORDER.filter((c) => grouped[c].length > 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 overflow-y-auto rounded-lg border bg-white p-3 min-h-0',
        isOver && 'border-rose-400 bg-rose-50',
      )}
    >
      <h3 className="mb-2 text-xs font-semibold text-gray-600">
        {t('seatingUnseated')} ({guests.length})
      </h3>
      {guests.length === 0 ? (
        <p className="pt-4 text-center text-[11px] text-gray-400">{t('seatingAllSeated')} 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {nonEmptyCategories.map((cat) => {
            const catGuests = grouped[cat];
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                  className="flex w-full items-center justify-between rounded px-1 py-0.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate text-start">{cat}</span>
                  <span className="ml-1 shrink-0 text-gray-400">
                    {catGuests.length} {isCollapsed ? '▸' : '▾'}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 flex flex-col gap-0.5 ps-1">
                    {catGuests.map((g) => (
                      <GuestChip key={g.id} guest={g} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shape icon ───────────────────────────────────────────────────────────────

function ShapeIcon({ shape }: { shape: TableShape }) {
  if (shape === 'ROUND') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" className="mx-auto">
        <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (shape === 'SQUARE') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" className="mx-auto">
        <rect x="3" y="3" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="36" height="24" viewBox="0 0 48 28" className="mx-auto">
      <rect x="2" y="4" width="44" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ─── Add table dialog ─────────────────────────────────────────────────────────

function AddTableDialog({
  onAdd,
}: {
  onAdd: (name: string, shape: TableShape, capacity: number) => void;
}) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('ROUND');
  const [capacity, setCapacity] = useState(8);

  const shapes: TableShape[] = ['ROUND', 'SQUARE', 'RECTANGLE'];
  const shapeLabel: Record<TableShape, string> = {
    ROUND: t('seatingRound'),
    SQUARE: t('seatingSquare'),
    RECTANGLE: t('seatingRectangle'),
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), shape, capacity);
    setOpen(false);
    setName('');
    setShape('ROUND');
    setCapacity(8);
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="w-full gap-1.5">
        <Plus className="h-4 w-4" />
        {t('addTable')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('addTable')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t('seatingTableName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Table 1"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('seatingShape')}</Label>
              <div className="flex gap-2">
                {shapes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    className={cn(
                      'flex flex-1 flex-col items-center rounded-lg border-2 py-2 text-[11px] font-medium transition-colors',
                      shape === s
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                  >
                    <ShapeIcon shape={s} />
                    <span className="mt-1">{shapeLabel[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('seatingChairs')}</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Math.min(30, Number(e.target.value))))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>
              {t('addTable')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Background panel ─────────────────────────────────────────────────────────

function BackgroundPanel({
  background,
  onUpload,
  onRemove,
}: {
  background: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('dashboard');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    await onUpload(e);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2">
      <span className="text-xs font-semibold text-gray-600">{t('seatingSketchBackground')}</span>

      {background ? (
        <div className="space-y-1.5">
          <img
            src={background}
            alt="floor plan"
            className="w-full rounded object-cover h-20"
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-red-500 hover:text-red-600"
            onClick={onRemove}
          >
            <ImageOff className="h-3 w-3 mr-1" />
            {t('seatingRemoveBackground')}
          </Button>
        </div>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3 w-3" />
            {uploading ? t('seatingUploading') : t('seatingUploadSketch')}
          </Button>
          <p className="text-center text-[10px] text-gray-400">{t('seatingBuildOwn')}</p>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Main SeatingCanvas ───────────────────────────────────────────────────────

export function SeatingCanvas({
  initialTables,
  initialUnseated,
  background: initialBackground,
}: {
  initialTables: TableWithGuests[];
  initialUnseated: Guest[];
  background: string | null;
}) {
  const [tables, setTables] = useState<TableWithGuests[]>(initialTables);
  const [unseated, setUnseated] = useState<Guest[]>(initialUnseated);
  const [background, setBackground] = useState<string | null>(initialBackground);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function findGuest(id: string): Guest | undefined {
    const inUnseated = unseated.find((g) => g.id === id);
    if (inUnseated) return inUnseated;
    for (const t of tables) {
      const g = t.guests.find((g) => g.id === id);
      if (g) return g;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveGuest(findGuest(event.active.id as string) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveGuest(null);
    const { active, over } = event;
    if (!over) return;

    const guestId = active.id as string;
    const targetId = over.id as string;
    const guest = findGuest(guestId);
    if (!guest) return;

    if (targetId === 'unseated') {
      setTables((prev) =>
        prev.map((t) => ({ ...t, guests: t.guests.filter((g) => g.id !== guestId) })),
      );
      setUnseated((prev) => (prev.some((g) => g.id === guestId) ? prev : [...prev, guest]));
      assignGuestToTable(guestId, null);
      return;
    }

    const target = tables.find((t) => t.id === targetId);
    if (!target || target.guests.length >= target.capacity) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetId)
          return { ...t, guests: [...t.guests.filter((g) => g.id !== guestId), guest] };
        return { ...t, guests: t.guests.filter((g) => g.id !== guestId) };
      }),
    );
    setUnseated((prev) => prev.filter((g) => g.id !== guestId));
    assignGuestToTable(guestId, targetId);
  }

  function handleAddTable(name: string, shape: TableShape, capacity: number) {
    const x = 40 + Math.random() * 350;
    const y = 40 + Math.random() * 250;
    createTable({ name, shape, capacity, x, y } as any).then((newTable) => {
      setTables((prev) => [
        ...prev,
        { ...newTable, guests: [], shape: newTable.shape as TableShape },
      ]);
    });
  }

  function handleDeleteTable(tableId: string) {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    setUnseated((prev) => [
      ...prev,
      ...table.guests.filter((g) => !prev.some((u) => u.id === g.id)),
    ]);
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    deleteTable(tableId);
  }

  function handleRemoveGuest(guestId: string) {
    const guest = findGuest(guestId);
    if (!guest) return;
    setTables((prev) =>
      prev.map((t) => ({ ...t, guests: t.guests.filter((g) => g.id !== guestId) })),
    );
    setUnseated((prev) => (prev.some((g) => g.id === guestId) ? prev : [...prev, guest]));
    assignGuestToTable(guestId, null);
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/seating/background', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setBackground(data.url);
  }

  function handleRemoveBackground() {
    setBackground(null);
    updateSeatingBackground(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[720px] gap-4">
        {/* Left sidebar */}
        <div className="flex w-52 shrink-0 flex-col gap-3">
          <AddTableDialog onAdd={handleAddTable} />
          <BackgroundPanel
            background={background}
            onUpload={handleBackgroundUpload}
            onRemove={handleRemoveBackground}
          />
          <UnseatedPanel guests={unseated} />
        </div>

        {/* Canvas */}
        <div
          className="relative flex-1 overflow-auto rounded-xl border-2 border-dashed border-gray-200"
          style={
            background
              ? {
                  backgroundImage: `url(${background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { backgroundColor: '#f9fafb' }
          }
        >
          {tables.length === 0 && !background && (
            <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-gray-300">
              <div className="text-center">
                <div className="mb-2 text-5xl">🪑</div>
                <p className="text-sm">Add tables to start seating guests</p>
              </div>
            </div>
          )}

          {/* Inner scrollable area – large so tables can be placed anywhere */}
          <div className="relative" style={{ minWidth: 1200, minHeight: 800 }}>
            {tables.map((table) => (
              <VisualTable
                key={table.id}
                table={table}
                onDelete={() => handleDeleteTable(table.id)}
                onRemoveGuest={handleRemoveGuest}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeGuest && (
          <div className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800 shadow-lg">
            {activeGuest.firstName} {activeGuest.lastName}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
