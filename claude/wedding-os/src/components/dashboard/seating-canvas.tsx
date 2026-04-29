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
import { assignSeatToTable, createTable, deleteTable, moveTable, updateSeatingBackground } from '@/actions/seating';
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
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────

type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE';

type SeatGuest = {
  id: string;
  guestType: string;
  firstName: string;
  lastName: string;
  group: string | null;
};

type SeatUnit = {
  id: string;         // GuestSeat.id — used as DnD id
  guestId: string;
  seatIndex: number;
  guest: SeatGuest;
  tableId: string | null;
};

type TableWithSeats = {
  id: string;
  weddingId: string;
  name: string;
  shape: TableShape;
  capacity: number;
  x: number;
  y: number;
  guestSeats: SeatUnit[];
};

// ─── Display name ─────────────────────────────────────────────────────────────

function seatLabel(seat: SeatUnit): string {
  const { guest, seatIndex } = seat;
  if (guest.guestType === 'FAMILY') {
    return `${guest.lastName} ${seatIndex + 1}`;
  }
  const base = [guest.firstName, guest.lastName].filter(Boolean).join(' ');
  return seatIndex === 0 ? base : `${base} +${seatIndex}`;
}

// ─── Dimensions per shape ─────────────────────────────────────────────────────

const DIMS: Record<TableShape, { w: number; h: number }> = {
  ROUND:     { w: 200, h: 200 },
  SQUARE:    { w: 180, h: 180 },
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

// ─── Table SVG ────────────────────────────────────────────────────────────────

function TableSVG({
  shape, W, H, seated, capacity, isOver,
}: {
  shape: TableShape; W: number; H: number; seated: number; capacity: number; isOver: boolean;
}) {
  const stroke = isOver ? '#f43f5e' : '#d1d5db';
  const fill   = isOver ? '#fff1f2' : '#ffffff';

  if (shape === 'ROUND') {
    const cx = W / 2, cy = H / 2;
    const tableR = Math.min(W, H) / 2 - 22;
    const seatR  = tableR + 14;
    const seats  = getRoundSeats(capacity, cx, cy, seatR);
    return (
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={tableR} fill={fill} stroke={stroke} strokeWidth={2.5} />
        {seats.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={7}
            fill={i < seated ? '#f43f5e' : '#e5e7eb'} stroke="white" strokeWidth={1.5} />
        ))}
      </svg>
    );
  }

  const margin = 20;
  const x1 = margin, y1 = margin, x2 = W - margin, y2 = H - margin;
  const seats = getRectSeats(capacity, x1, y1, x2, y2);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={8}
        fill={fill} stroke={stroke} strokeWidth={2.5} />
      {seats.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={7}
          fill={i < seated ? '#f43f5e' : '#e5e7eb'} stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

// ─── Seat chip ────────────────────────────────────────────────────────────────

function SeatChip({ seat, onRemove }: { seat: SeatUnit; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: seat.id });
  const isFamily = seat.guest.guestType === 'FAMILY';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-guest="true"
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] cursor-grab select-none',
        isFamily
          ? 'bg-violet-50 text-violet-800'
          : 'bg-rose-50 text-rose-800',
        isDragging && 'opacity-40',
      )}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      <span className="truncate max-w-[90px]">{seatLabel(seat)}</span>
      {onRemove && (
        <button
          data-action="true"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
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
  table, onDelete, onRemoveSeat,
}: {
  table: TableWithSeats;
  onDelete: () => void;
  onRemoveSeat: (seatId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const [pos, setPos] = useState({ x: table.x, y: table.y });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const { w: W, h: H } = DIMS[table.shape];
  const seated = table.guestSeats.length;
  const maxVisible = table.shape === 'RECTANGLE' ? 4 : 3;

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

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{ left: pos.x, top: pos.y, width: W, height: H }}
    >
      <TableSVG shape={table.shape} W={W} H={H} seated={seated} capacity={table.capacity} isOver={isOver} />

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
          {table.guestSeats.slice(0, maxVisible).map((s) => (
            <SeatChip key={s.id} seat={s} onRemove={() => onRemoveSeat(s.id)} />
          ))}
          {table.guestSeats.length > maxVisible && (
            <span className="text-[9px] text-gray-400">
              +{table.guestSeats.length - maxVisible} more
            </span>
          )}
        </div>
      </div>

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

function UnseatedPanel({ seats }: { seats: SeatUnit[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated' });
  const t = useTranslations('dashboard');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = CATEGORY_ORDER.reduce<Record<string, SeatUnit[]>>((acc, cat) => {
    acc[cat] = [];
    return acc;
  }, {});
  for (const s of seats) {
    const key = s.guest.group && CATEGORY_ORDER.includes(s.guest.group) ? s.guest.group : 'Other';
    grouped[key].push(s);
  }
  const nonEmpty = CATEGORY_ORDER.filter((c) => grouped[c].length > 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 overflow-y-auto rounded-lg border bg-white p-3 min-h-0',
        isOver && 'border-rose-400 bg-rose-50',
      )}
    >
      <h3 className="mb-2 text-xs font-semibold text-gray-600">
        {t('seatingUnseated')} ({seats.length})
      </h3>
      {seats.length === 0 ? (
        <p className="pt-4 text-center text-[11px] text-gray-400">{t('seatingAllSeated')} 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {nonEmpty.map((cat) => {
            const catSeats = grouped[cat];
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }))}
                  className="flex w-full items-center justify-between rounded px-1 py-0.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate text-start">{cat}</span>
                  <span className="ml-1 shrink-0 text-gray-400">
                    {catSeats.length} {isCollapsed ? '▸' : '▾'}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 flex flex-col gap-0.5 ps-1">
                    {catSeats.map((s) => <SeatChip key={s.id} seat={s} />)}
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
  if (shape === 'ROUND') return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="mx-auto">
      <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
  if (shape === 'SQUARE') return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="mx-auto">
      <rect x="3" y="3" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
  return (
    <svg width="36" height="24" viewBox="0 0 48 28" className="mx-auto">
      <rect x="2" y="4" width="44" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ─── Add table dialog ─────────────────────────────────────────────────────────

function AddTableDialog({ onAdd }: { onAdd: (name: string, shape: TableShape, capacity: number) => void }) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [shape, setShape] = useState<TableShape>('ROUND');
  const [capacity, setCapacity] = useState(8);

  const shapes: TableShape[] = ['ROUND', 'SQUARE', 'RECTANGLE'];
  const shapeLabel: Record<TableShape, string> = {
    ROUND: t('seatingRound'), SQUARE: t('seatingSquare'), RECTANGLE: t('seatingRectangle'),
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
          <DialogHeader><DialogTitle>{t('addTable')}</DialogTitle></DialogHeader>
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
                    key={s} type="button" onClick={() => setShape(s)}
                    className={cn(
                      'flex flex-1 flex-col items-center rounded-lg border-2 py-2 text-[11px] font-medium transition-colors',
                      shape === s ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-500 hover:border-gray-300',
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
                type="number" min={1} max={30} value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Math.min(30, Number(e.target.value))))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>{t('addTable')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Background panel ─────────────────────────────────────────────────────────

function BackgroundPanel({
  background, onUpload, onRemove,
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
          <img src={background} alt="floor plan" className="w-full rounded object-cover h-20" />
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-red-500 hover:text-red-600" onClick={onRemove}>
            <ImageOff className="h-3 w-3 mr-1" />
            {t('seatingRemoveBackground')}
          </Button>
        </div>
      ) : (
        <>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-3 w-3" />
            {uploading ? t('seatingUploading') : t('seatingUploadSketch')}
          </Button>
          <p className="text-center text-[10px] text-gray-400">{t('seatingBuildOwn')}</p>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Main SeatingCanvas ───────────────────────────────────────────────────────

export function SeatingCanvas({
  initialTables,
  initialUnseated,
  background: initialBackground,
}: {
  initialTables: TableWithSeats[];
  initialUnseated: SeatUnit[];
  background: string | null;
}) {
  const [tables, setTables] = useState<TableWithSeats[]>(initialTables);
  const [unseated, setUnseated] = useState<SeatUnit[]>(initialUnseated);
  const [background, setBackground] = useState<string | null>(initialBackground);
  const [activeSeat, setActiveSeat] = useState<SeatUnit | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function findSeat(id: string): SeatUnit | undefined {
    const inUnseated = unseated.find((s) => s.id === id);
    if (inUnseated) return inUnseated;
    for (const t of tables) {
      const s = t.guestSeats.find((s) => s.id === id);
      if (s) return s;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveSeat(findSeat(event.active.id as string) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSeat(null);
    const { active, over } = event;
    if (!over) return;

    const seatId  = active.id as string;
    const targetId = over.id as string;
    const seat = findSeat(seatId);
    if (!seat) return;

    if (targetId === 'unseated') {
      setTables((prev) =>
        prev.map((t) => ({ ...t, guestSeats: t.guestSeats.filter((s) => s.id !== seatId) })),
      );
      setUnseated((prev) => prev.some((s) => s.id === seatId) ? prev : [...prev, seat]);
      assignSeatToTable(seatId, null);
      return;
    }

    const target = tables.find((t) => t.id === targetId);
    if (!target || target.guestSeats.length >= target.capacity) return;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetId)
          return { ...t, guestSeats: [...t.guestSeats.filter((s) => s.id !== seatId), seat] };
        return { ...t, guestSeats: t.guestSeats.filter((s) => s.id !== seatId) };
      }),
    );
    setUnseated((prev) => prev.filter((s) => s.id !== seatId));
    assignSeatToTable(seatId, targetId);
  }

  function handleAddTable(name: string, shape: TableShape, capacity: number) {
    const x = 40 + Math.random() * 350;
    const y = 40 + Math.random() * 250;
    createTable({ name, shape, capacity, x, y } as any).then((newTable) => {
      setTables((prev) => [
        ...prev,
        { ...newTable, guestSeats: [], shape: newTable.shape as TableShape },
      ]);
    });
  }

  function handleDeleteTable(tableId: string) {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    setUnseated((prev) => [
      ...prev,
      ...table.guestSeats.filter((s) => !prev.some((u) => u.id === s.id)),
    ]);
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    deleteTable(tableId);
  }

  function handleRemoveSeat(seatId: string) {
    const seat = findSeat(seatId);
    if (!seat) return;
    setTables((prev) =>
      prev.map((t) => ({ ...t, guestSeats: t.guestSeats.filter((s) => s.id !== seatId) })),
    );
    setUnseated((prev) => prev.some((s) => s.id === seatId) ? prev : [...prev, seat]);
    assignSeatToTable(seatId, null);
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
          <UnseatedPanel seats={unseated} />
        </div>

        {/* Canvas */}
        <div
          className="relative flex-1 overflow-auto rounded-xl border-2 border-dashed border-gray-200"
          style={
            background
              ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: '#f9fafb' }
          }
        >
          <div className="relative min-h-full min-w-full" style={{ height: 800, width: 1200 }}>
            {tables.map((table) => (
              <VisualTable
                key={table.id}
                table={table}
                onDelete={() => handleDeleteTable(table.id)}
                onRemoveSeat={handleRemoveSeat}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeSeat && (
          <div className={cn(
            'rounded px-2 py-1 text-[11px] font-medium shadow-lg',
            activeSeat.guest.guestType === 'FAMILY' ? 'bg-violet-100 text-violet-800' : 'bg-rose-100 text-rose-800',
          )}>
            {seatLabel(activeSeat)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
