'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  Radio,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  reorderScheduleItems,
} from '@/actions/schedule';
import type { ChecklistItem } from '@/actions/schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorInfo = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  amountPaid: number;
  remainingBalance: number;
};

type ScheduleItemFull = {
  id: string;
  time: string;
  duration: number;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  vendorId: string | null;
  vendor: VendorInfo | null;
  checklist: ChecklistItem[];
  status: string;
  order: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, { label: string; labelHe: string; color: string }> = {
  ceremony:       { label: 'Ceremony',      labelHe: 'טקס',            color: 'bg-blue-100 text-blue-700 border-blue-200' },
  reception:      { label: 'Reception',     labelHe: 'קבלת פנים',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  vendor_arrival: { label: 'Vendor Arrival',labelHe: 'הגעת ספק',       color: 'bg-amber-100 text-amber-700 border-amber-200' },
  photo:          { label: 'Photo',         labelHe: 'צילום',           color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  personal:       { label: 'Personal',      labelHe: 'אישי',            color: 'bg-rose-100 text-rose-700 border-rose-200' },
  custom:         { label: 'Custom',        labelHe: 'כללי',            color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const STATUSES: Record<string, { label: string; labelHe: string; color: string }> = {
  pending:  { label: 'Pending',  labelHe: 'ממתין',  color: 'bg-gray-100 text-gray-600' },
  'on-time':{ label: 'On Time', labelHe: 'בזמן',   color: 'bg-green-100 text-green-700' },
  delayed:  { label: 'Delayed', labelHe: 'מאחר',   color: 'bg-red-100 text-red-700' },
  done:     { label: 'Done',    labelHe: 'הסתיים', color: 'bg-emerald-100 text-emerald-700' },
};

const BUFFER_WARN_MINUTES = 15;

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToDisplay(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
}

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Live Mode ────────────────────────────────────────────────────────────────

function LiveMode({ items, onClose }: { items: ScheduleItemFull[]; onClose: () => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const activeItem = sorted.find(
    (i) => timeToMinutes(i.time) <= nowMinutes && nowMinutes < timeToMinutes(i.time) + i.duration,
  );
  const nextItem = sorted.find((i) => timeToMinutes(i.time) > nowMinutes);
  const remaining = sorted.filter((i) => timeToMinutes(i.time) + i.duration > nowMinutes);

  const countdownSeconds = nextItem
    ? (timeToMinutes(nextItem.time) - nowMinutes) * 60 - now.getSeconds()
    : null;

  const formatCountdown = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-rose-400 animate-pulse" />
          <span className="text-rose-400 font-semibold tracking-wide uppercase text-sm">Live Mode</span>
        </div>
        <div className="font-mono text-4xl font-bold tracking-wider text-white">{timeStr}</div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-800 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          {activeItem ? (
            <div className="text-center space-y-3">
              <Badge className={cn('text-xs', CATEGORIES[activeItem.category]?.color)}>
                {CATEGORIES[activeItem.category]?.label}
              </Badge>
              <h2 className="text-5xl font-serif font-bold">{activeItem.title}</h2>
              <p className="text-gray-400 text-lg">{activeItem.time} · {minutesToDisplay(activeItem.duration)}</p>
              {activeItem.location && (
                <p className="flex items-center justify-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" /> {activeItem.location}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🌸</div>
              <p className="text-xl">No active event right now</p>
            </div>
          )}

          {nextItem && countdownSeconds !== null && countdownSeconds >= 0 && (
            <div className="text-center mt-4 p-6 rounded-2xl bg-gray-900 border border-gray-800 min-w-72">
              <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">Next up</p>
              <p className="text-xl font-semibold mb-2">{nextItem.title}</p>
              <p className="font-mono text-3xl font-bold text-rose-400">{formatCountdown(countdownSeconds)}</p>
              <p className="text-gray-500 text-sm mt-1">{nextItem.time}</p>
            </div>
          )}
        </div>

        {/* Remaining events */}
        <div className="w-80 border-l border-gray-800 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-800">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Remaining ({remaining.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {remaining.map((item) => {
              const isActive = item.id === activeItem?.id;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'px-6 py-4 border-b border-gray-800/50',
                    isActive && 'bg-rose-950/40 border-rose-800/40',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-400">{item.time}</span>
                    {isActive && <span className="text-xs text-rose-400">● NOW</span>}
                  </div>
                  <p className={cn('font-medium', isActive ? 'text-white' : 'text-gray-300')}>{item.title}</p>
                  {item.location && (
                    <p className="text-xs text-gray-600 mt-0.5">{item.location}</p>
                  )}
                </div>
              );
            })}
            {remaining.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-600">All events completed 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────

type FormState = {
  time: string;
  duration: string;
  title: string;
  description: string;
  location: string;
  category: string;
  vendorId: string;
  status: string;
  checklist: ChecklistItem[];
};

const EMPTY_FORM: FormState = {
  time: '09:00',
  duration: '60',
  title: '',
  description: '',
  location: '',
  category: 'custom',
  vendorId: '__none__',
  status: 'pending',
  checklist: [],
};

function EventDialog({
  open,
  onClose,
  onSave,
  initial,
  vendors,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => Promise<void>;
  initial?: FormState;
  vendors: VendorInfo[];
  locale: string;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const isHe = locale === 'he';

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
    setNewChecklistText('');
  }, [open, initial]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addChecklistItem() {
    if (!newChecklistText.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistText.trim(), done: false };
    setForm((prev) => ({ ...prev, checklist: [...prev.checklist, item] }));
    setNewChecklistText('');
  }

  function removeChecklistItem(id: string) {
    setForm((prev) => ({ ...prev, checklist: prev.checklist.filter((c) => c.id !== id) }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.time) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  const catLabel = (cat: string) => isHe ? CATEGORIES[cat]?.labelHe : CATEGORIES[cat]?.label;
  const statusLabel = (s: string) => isHe ? STATUSES[s]?.labelHe : STATUSES[s]?.label;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? (isHe ? 'עריכת אירוע' : 'Edit Event') : (isHe ? 'הוספת אירוע' : 'Add Event')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isHe ? 'שעה' : 'Time'}</Label>
              <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'משך (דקות)' : 'Duration (min)'}</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>{isHe ? 'כותרת *' : 'Title *'}</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={isHe ? 'לדוגמה: הגעת הצלם' : 'e.g. Photographer arrives'}
            />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isHe ? 'קטגוריה' : 'Category'}</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k]) => (
                    <SelectItem key={k} value={k}>{catLabel(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'סטטוס' : 'Status'}</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUSES).map(([k]) => (
                    <SelectItem key={k} value={k}>{statusLabel(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{isHe ? 'תיאור' : 'Description'}</Label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>{isHe ? 'מיקום' : 'Location'}</Label>
            <Input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder={isHe ? 'לדוגמה: חדר כלה' : 'e.g. Bridal suite'}
            />
          </div>

          {/* Vendor */}
          <div className="space-y-1.5">
            <Label>{isHe ? 'ספק מקושר' : 'Linked Vendor'}</Label>
            <Select
              value={form.vendorId || '__none__'}
              onValueChange={(v) => set('vendorId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isHe ? 'ללא ספק' : 'No vendor'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{isHe ? 'ללא ספק' : 'No vendor'}</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>{isHe ? 'צ\'קליסט' : 'Checklist'}</Label>
            <div className="space-y-1">
              {form.checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                  <span className="flex-1 text-sm">{c.text}</span>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(c.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                placeholder={isHe ? 'הוסף פריט...' : 'Add item...'}
                className="flex-1 h-8 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={addChecklistItem}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{isHe ? 'ביטול' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {isHe ? 'שמירה' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sortable event card ──────────────────────────────────────────────────────

function EventCard({
  item,
  onEdit,
  onDelete,
  onToggleChecklist,
  showBufferWarning,
  locale,
}: {
  item: ScheduleItemFull;
  onEdit: () => void;
  onDelete: () => void;
  onToggleChecklist: (itemId: string, checkId: string, done: boolean) => void;
  showBufferWarning: boolean;
  locale: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [showChecklist, setShowChecklist] = useState(false);
  const isHe = locale === 'he';
  const cat = CATEGORIES[item.category] ?? CATEGORIES.custom;
  const statusInfo = STATUSES[item.status] ?? STATUSES.pending;
  const doneCount = item.checklist.filter((c) => c.done).length;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      {showBufferWarning && (
        <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {isHe ? 'אין מרווח זמן בין אירועים' : 'No buffer time between events'}
        </div>
      )}

      <div
        className={cn(
          'group rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
          item.status === 'done' && 'opacity-60',
        )}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Drag handle */}
          <button
            {...listeners}
            {...attributes}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Time column */}
          <div className="shrink-0 w-16 text-center">
            <p className="font-mono text-sm font-bold text-gray-800">{item.time}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{minutesToDisplay(item.duration)}</p>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[11px] font-medium border rounded-full px-2 py-0.5', cat.color)}>
                {isHe ? cat.labelHe : cat.label}
              </span>
              <span className={cn('text-[11px] rounded-full px-2 py-0.5', statusInfo.color)}>
                {isHe ? statusInfo.labelHe : statusInfo.label}
              </span>
              {item.status === 'done' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
            </div>

            <p className="font-semibold text-gray-900 leading-tight">{item.title}</p>

            {item.description && (
              <p className="text-sm text-gray-500 leading-snug">{item.description}</p>
            )}

            {item.location && (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {item.location}
              </p>
            )}

            {/* Vendor */}
            {item.vendor && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border px-3 py-1.5 flex-wrap">
                <span className="text-xs font-medium text-gray-700">{item.vendor.name}</span>
                <span className="text-[10px] text-gray-400">{item.vendor.category}</span>
                {item.vendor.remainingBalance > 0 && (
                  <span className="text-[10px] text-amber-600 font-medium">
                    ₪{item.vendor.remainingBalance.toLocaleString()} {isHe ? 'נותר' : 'remaining'}
                  </span>
                )}
                <div className="flex items-center gap-1 ms-auto">
                  {item.vendor.phone && (
                    <a
                      href={`tel:${item.vendor.phone}`}
                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-blue-600 transition-colors"
                      title="Call"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {item.vendor.phone && (
                    <a
                      href={`https://wa.me/${item.vendor.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-green-600 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {item.vendor.email && (
                    <a
                      href={`mailto:${item.vendor.email}`}
                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-rose-600 transition-colors"
                      title="Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Checklist toggle */}
            {item.checklist.length > 0 && (
              <button
                type="button"
                onClick={() => setShowChecklist((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>
                  {doneCount}/{item.checklist.length} {isHe ? 'הושלמו' : 'done'}
                </span>
                {showChecklist ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}

            {showChecklist && (
              <div className="space-y-1 ps-1 pt-0.5">
                {item.checklist.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleChecklist(item.id, c.id, !c.done)}
                    className="flex items-center gap-2 w-full text-start text-xs text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {c.done ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                    )}
                    <span className={c.done ? 'line-through text-gray-400' : ''}>{c.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScheduleTimeline({
  initialItems,
  vendors,
  locale: localeProp,
}: {
  initialItems: ScheduleItemFull[];
  vendors: VendorInfo[];
  locale?: string;
}) {
  const t = useTranslations('dashboard');
  const [items, setItems] = useState<ScheduleItemFull[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItemFull | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [locale, setLocale] = useState(localeProp ?? 'en');

  // Derive locale from document if not passed
  useEffect(() => {
    if (!localeProp) {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'he' || parts[1] === 'en') setLocale(parts[1]);
    }
  }, [localeProp]);

  const isHe = locale === 'he';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Sorted by time for buffer warnings; displayed by order
  const sortedByTime = [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const bufferWarnings = new Set<string>();
  for (let i = 0; i < sortedByTime.length - 1; i++) {
    const a = sortedByTime[i];
    const b = sortedByTime[i + 1];
    const gap = timeToMinutes(b.time) - (timeToMinutes(a.time) + a.duration);
    if (gap >= 0 && gap < BUFFER_WARN_MINUTES) bufferWarnings.add(b.id);
  }

  function itemToForm(item: ScheduleItemFull): FormState {
    return {
      time: item.time,
      duration: String(item.duration),
      title: item.title,
      description: item.description ?? '',
      location: item.location ?? '',
      category: item.category,
      vendorId: item.vendorId ?? '__none__',
      status: item.status,
      checklist: item.checklist,
    };
  }

  async function handleSave(form: FormState) {
    const vendor = vendors.find((v) => v.id === form.vendorId) ?? null;
    const payload = {
      time: form.time,
      duration: Math.max(1, parseInt(form.duration) || 60),
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      category: form.category,
      vendorId: form.vendorId === '__none__' ? null : form.vendorId || null,
      checklist: form.checklist,
      status: form.status,
    };

    const actionPayload = {
      ...payload,
      description: payload.description ?? undefined,
      location: payload.location ?? undefined,
    };

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...i, ...payload, vendor } : i,
        ),
      );
      await updateScheduleItem(editingItem.id, actionPayload);
    } else {
      const order = items.length;
      const created = await createScheduleItem({ ...actionPayload, order });
      setItems((prev) => [
        ...prev,
        { ...created, vendor, checklist: created.checklist as ChecklistItem[] } as ScheduleItemFull,
      ]);
    }
    setEditingItem(null);
  }

  function handleEdit(item: ScheduleItemFull) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteScheduleItem(id);
  }

  async function handleToggleChecklist(itemId: string, checkId: string, done: boolean) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const checklist = i.checklist.map((c) => (c.id === checkId ? { ...c, done } : c));
        updateScheduleItem(itemId, { checklist });
        return { ...i, checklist };
      }),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      reorderScheduleItems(reordered.map((i) => i.id));
      return reordered;
    });
  }

  return (
    <>
      {liveMode && <LiveMode items={items} onClose={() => setLiveMode(false)} />}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isHe ? 'הוסף אירוע' : 'Add Event'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLiveMode(true)}
          className="gap-1.5 ms-auto"
        >
          <Radio className="h-4 w-4 text-rose-500" />
          {isHe ? 'מצב חי' : 'Go Live'}
        </Button>
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center text-gray-400">
          <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm">{isHe ? 'אין אירועים. הוסף את האירוע הראשון!' : 'No events yet. Add your first event!'}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <EventCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                  onToggleChecklist={handleToggleChecklist}
                  showBufferWarning={bufferWarnings.has(item.id)}
                  locale={locale}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dialog */}
      <EventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        initial={editingItem ? itemToForm(editingItem) : undefined}
        vendors={vendors}
        locale={locale}
      />
    </>
  );
}
