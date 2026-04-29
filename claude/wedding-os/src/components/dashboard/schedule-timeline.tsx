'use client';

import { useState, useEffect } from 'react';
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
  Plus, GripVertical, Trash2, Pencil, Phone, Mail, MessageCircle,
  MapPin, Clock, ChevronDown, ChevronRight, CheckSquare, Square,
  AlertTriangle, Radio, X, Check, Download, Send, Share2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  createScheduleItem, updateScheduleItem, deleteScheduleItem, reorderScheduleItems,
} from '@/actions/schedule';
import type { ChecklistItem } from '@/actions/schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorInfo = {
  id: string; name: string; category: string;
  phone: string | null; email: string | null;
  amountPaid: number; remainingBalance: number;
};

type ScheduleItemFull = {
  id: string; time: string; duration: number; title: string;
  description: string | null; location: string | null; category: string;
  vendorId: string | null; vendor: VendorInfo | null;
  checklist: ChecklistItem[]; status: string; order: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: Record<string, { en: string; he: string; color: string; dot: string }> = {
  ceremony:       { en: 'Ceremony',       he: 'טקס',           color: 'bg-blue-100 text-blue-700 border-blue-200',     dot: '#3b82f6' },
  reception:      { en: 'Reception',      he: 'קבלת פנים',     color: 'bg-violet-100 text-violet-700 border-violet-200',dot: '#8b5cf6' },
  vendor_arrival: { en: 'Vendor Arrival', he: 'הגעת ספק',      color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: '#f59e0b' },
  photo:          { en: 'Photo',          he: 'צילום',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: '#10b981' },
  personal:       { en: 'Personal',       he: 'אישי',           color: 'bg-rose-100 text-rose-700 border-rose-200',     dot: '#f43f5e' },
  custom:         { en: 'Custom',         he: 'כללי',           color: 'bg-gray-100 text-gray-600 border-gray-200',     dot: '#9ca3af' },
};

const STATUSES: Record<string, { en: string; he: string; badge: string }> = {
  pending:   { en: 'Pending',  he: 'ממתין',  badge: 'bg-gray-100 text-gray-500' },
  'on-time': { en: 'On Time', he: 'בזמן',   badge: 'bg-green-100 text-green-700' },
  delayed:   { en: 'Delayed', he: 'מאחר',   badge: 'bg-red-100 text-red-600' },
  done:      { en: 'Done',    he: 'הסתיים', badge: 'bg-emerald-100 text-emerald-700' },
};

const PHASES = [
  { id: 'morning',  en: 'Morning Preparation',       he: 'הכנות בוקר',        icon: '🌅', endMin: 720  },
  { id: 'ceremony', en: 'Ceremony & Portraits',       he: 'טקס וצילומים',       icon: '💐', endMin: 1020 },
  { id: 'evening',  en: 'Reception & Celebration',    he: 'חגיגה וקבלת פנים',   icon: '🎊', endMin: 1440 },
];

const BUFFER_WARN = 15;

function timeToMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }

function durLabel(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ─── ICS generation ───────────────────────────────────────────────────────────

function buildICS(items: ScheduleItemFull[], weddingDate: Date | null): string {
  const base = weddingDate ? new Date(weddingDate) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:.Z]/g, '').slice(0, 15) + 'Z';

  const fmtLocal = (h: number, m: number) =>
    `${base.getFullYear()}${pad(base.getMonth() + 1)}${pad(base.getDate())}T${pad(h)}${pad(m)}00`;

  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//WeddingOS//Wedding Day Schedule//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ];

  for (const item of items) {
    const [h, m] = item.time.split(':').map(Number);
    const endMs = new Date(base).setHours(h, m + item.duration, 0, 0);
    const endD = new Date(endMs);
    const endStr = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}T${pad(endD.getHours())}${pad(endD.getMinutes())}00`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}@weddingos.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtLocal(h, m)}`,
      `DTEND:${endStr}`,
      `SUMMARY:${item.title}`,
      ...(item.description ? [`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`] : []),
      ...(item.location ? [`LOCATION:${item.location}`] : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Share dialog ─────────────────────────────────────────────────────────────

function ShareDialog({
  items, vendors, weddingDate, coupleNames, locale, onClose,
}: {
  items: ScheduleItemFull[];
  vendors: VendorInfo[];
  weddingDate: Date | null;
  coupleNames: string;
  locale: string;
  onClose: () => void;
}) {
  const isHe = locale === 'he';
  const [tab, setTab] = useState<'download' | 'email' | 'vendors'>('download');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const vendorsWithEmail = vendors.filter((v) => v.email);
  const vendorItems = (vendorId: string) => items.filter((i) => i.vendorId === vendorId);

  async function sendEmail(to: string, itemIds: string[], msg: string) {
    setSending(true); setError('');
    try {
      const res = await fetch('/api/schedule/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, itemIds, message: msg }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent((prev) => ({ ...prev, [to]: true }));
    } catch {
      setError(isHe ? 'שגיאה בשליחה, אנא נסה שוב' : 'Send failed, please try again');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isHe ? 'שיתוף לוח הזמנים' : 'Share Schedule'}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['download', 'email', 'vendors'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t === 'download' ? (isHe ? 'הורדה' : 'Download')
                : t === 'email' ? (isHe ? 'שליחה למייל' : 'Send Email')
                : (isHe ? 'ספקים' : 'Vendors')}
            </button>
          ))}
        </div>

        {/* Download tab */}
        {tab === 'download' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isHe
                ? 'הורד את לוח הזמנים כקובץ .ics לייבוא ל-Google Calendar, Apple Calendar או Outlook.'
                : 'Download the schedule as a .ics file to import into Google Calendar, Apple Calendar, or Outlook.'}
            </p>
            <Button
              className="w-full gap-2"
              onClick={() => triggerDownload(buildICS(items, weddingDate), `${coupleNames}-schedule.ics`)}
            >
              <Download className="h-4 w-4" />
              {isHe ? 'הורד לוח זמנים (.ics)' : 'Download Schedule (.ics)'}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              {isHe
                ? 'לאחר הורדה: פתח את הקובץ כדי לייבא לאפליקציית הלוח שלך'
                : 'After download: open the file to import into your calendar app'}
            </p>
          </div>
        )}

        {/* Email tab */}
        {tab === 'email' && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{isHe ? 'שלח אל' : 'Send to'}</Label>
              <Input
                type="email"
                placeholder="planner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'הודעה (אופציונלי)' : 'Message (optional)'}</Label>
              <textarea
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={isHe ? 'מצורף לוח הזמנים של חתונתנו...' : 'Attached is our wedding day schedule...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {sent[email] && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> {isHe ? 'נשלח בהצלחה!' : 'Sent successfully!'}
              </p>
            )}
            <Button
              className="w-full gap-2"
              disabled={!email || sending}
              onClick={() => sendEmail(email, items.map((i) => i.id), message)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isHe ? 'שלח עם קובץ .ics' : 'Send with .ics attachment'}
            </Button>
          </div>
        )}

        {/* Vendors tab */}
        {tab === 'vendors' && (
          <div className="space-y-3 py-2">
            {vendorsWithEmail.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isHe ? 'אין ספקים עם כתובת אימייל' : 'No vendors have an email address'}
              </p>
            ) : (
              vendorsWithEmail.map((v) => {
                const vItems = vendorItems(v.id);
                const isSent = sent[v.email!];
                return (
                  <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{v.name}</p>
                      <p className="text-xs text-gray-400 truncate">{v.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {vItems.length > 0
                          ? `${vItems.length} ${isHe ? 'אירועים' : 'event(s)'}: ${vItems.map((i) => i.time).join(', ')}`
                          : (isHe ? 'לא משויך לאירועים' : 'Not linked to any events')}
                      </p>
                    </div>
                    {isSent ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={vItems.length === 0 || sending}
                        onClick={() => sendEmail(v.email!, vItems.map((i) => i.id), '')}
                        className="shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isHe ? 'סגור' : 'Close'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Live mode ────────────────────────────────────────────────────────────────

function LiveMode({ items, onClose }: { items: ScheduleItemFull[]; onClose: () => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...items].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const active = sorted.find((i) => timeToMin(i.time) <= nowMin && nowMin < timeToMin(i.time) + i.duration);
  const next = sorted.find((i) => timeToMin(i.time) > nowMin);
  const remaining = sorted.filter((i) => timeToMin(i.time) + i.duration > nowMin);
  const countdownSec = next ? (timeToMin(next.time) - nowMin) * 60 - now.getSeconds() : null;
  const fmtCountdown = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white">
      <div className="flex items-center justify-between border-b border-gray-800 px-8 py-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 animate-pulse text-rose-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">Live</span>
        </div>
        <span className="font-mono text-4xl font-bold">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-800"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          {active ? (
            <div className="text-center space-y-2">
              <span className={cn('text-xs font-semibold uppercase tracking-wide rounded-full px-3 py-1 border', CATEGORIES[active.category]?.color)}>
                {CATEGORIES[active.category]?.en}
              </span>
              <h2 className="text-5xl font-serif font-bold mt-2">{active.title}</h2>
              <p className="text-gray-400">{active.time} · {durLabel(active.duration)}</p>
              {active.location && <p className="flex items-center justify-center gap-1.5 text-gray-500"><MapPin className="h-4 w-4" />{active.location}</p>}
            </div>
          ) : (
            <div className="text-center text-gray-600"><div className="text-6xl mb-3">🌸</div><p className="text-xl">No active event</p></div>
          )}
          {next && countdownSec !== null && countdownSec >= 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center min-w-64">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Next up in</p>
              <p className="font-mono text-3xl font-bold text-rose-400">{fmtCountdown(countdownSec)}</p>
              <p className="text-lg font-semibold mt-2">{next.title}</p>
              <p className="text-sm text-gray-500">{next.time}</p>
            </div>
          )}
        </div>
        <div className="w-72 border-l border-gray-800 flex flex-col">
          <div className="border-b border-gray-800 px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Remaining ({remaining.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/50">
            {remaining.map((item) => (
              <div key={item.id} className={cn('px-5 py-3', item.id === active?.id && 'bg-rose-950/30')}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{item.time}</span>
                  {item.id === active?.id && <span className="text-[10px] text-rose-400 font-semibold">● NOW</span>}
                </div>
                <p className={cn('text-sm font-medium', item.id === active?.id ? 'text-white' : 'text-gray-300')}>{item.title}</p>
                {item.location && <p className="text-xs text-gray-600 mt-0.5">{item.location}</p>}
              </div>
            ))}
            {remaining.length === 0 && <div className="p-6 text-center text-gray-600 text-sm">All done! 🎉</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit dialog ────────────────────────────────────────────────────────

type FormState = {
  time: string; duration: string; title: string; description: string;
  location: string; category: string; vendorId: string; status: string;
  checklist: ChecklistItem[];
};

const EMPTY_FORM: FormState = {
  time: '09:00', duration: '60', title: '', description: '', location: '',
  category: 'custom', vendorId: '__none__', status: 'pending', checklist: [],
};

function EventDialog({
  open, onClose, onSave, initial, vendors, locale,
}: {
  open: boolean; onClose: () => void; onSave: (d: FormState) => Promise<void>;
  initial?: FormState; vendors: VendorInfo[]; locale: string;
}) {
  const isHe = locale === 'he';
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => { setForm(initial ?? EMPTY_FORM); setNewItem(''); }, [open]);

  function set(field: keyof FormState, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  function addCheck() {
    if (!newItem.trim()) return;
    setForm((p) => ({ ...p, checklist: [...p.checklist, { id: crypto.randomUUID(), text: newItem.trim(), done: false }] }));
    setNewItem('');
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  const catLabel = (k: string) => isHe ? CATEGORIES[k]?.he : CATEGORIES[k]?.en;
  const statusLabel = (k: string) => isHe ? STATUSES[k]?.he : STATUSES[k]?.en;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? (isHe ? 'עריכת אירוע' : 'Edit Event') : (isHe ? 'הוספת אירוע' : 'Add Event')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isHe ? 'שעה' : 'Time'}</Label>
              <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'משך (דקות)' : 'Duration (min)'}</Label>
              <Input type="number" min={1} max={600} value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'כותרת *' : 'Title *'}</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={isHe ? 'לדוגמה: הגעת הצלם' : 'e.g. Photographer arrives'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isHe ? 'קטגוריה' : 'Category'}</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CATEGORIES).map(([k]) => <SelectItem key={k} value={k}>{catLabel(k)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'סטטוס' : 'Status'}</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUSES).map(([k]) => <SelectItem key={k} value={k}>{statusLabel(k)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'תיאור' : 'Description'}</Label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'מיקום' : 'Location'}</Label>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder={isHe ? 'לדוגמה: חדר כלה' : 'e.g. Bridal suite'} />
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'ספק מקושר' : 'Linked Vendor'}</Label>
            <Select value={form.vendorId || '__none__'} onValueChange={(v) => set('vendorId', v)}>
              <SelectTrigger><SelectValue placeholder={isHe ? 'ללא ספק' : 'No vendor'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{isHe ? 'ללא ספק' : 'No vendor'}</SelectItem>
                {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isHe ? "צ'קליסט" : 'Checklist'}</Label>
            <div className="space-y-1">
              {form.checklist.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                  <span className="flex-1 text-sm">{c.text}</span>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, checklist: p.checklist.filter((x) => x.id !== c.id) }))} className="text-gray-300 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheck())} placeholder={isHe ? 'הוסף פריט...' : 'Add item...'} className="flex-1 h-8 text-sm" />
              <Button type="button" size="sm" variant="outline" onClick={addCheck}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{isHe ? 'ביטול' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>{isHe ? 'שמירה' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sortable timeline row ────────────────────────────────────────────────────

function TimelineRow({
  item, isNow, showBuffer, onEdit, onDelete, onToggleCheck, locale, isFirst, isLast,
}: {
  item: ScheduleItemFull; isNow: boolean; showBuffer: boolean;
  onEdit: () => void; onDelete: () => void;
  onToggleCheck: (itemId: string, checkId: string, done: boolean) => void;
  locale: string; isFirst: boolean; isLast: boolean;
}) {
  const isHe = locale === 'he';
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[item.category] ?? CATEGORIES.custom;
  const statusInfo = STATUSES[item.status] ?? STATUSES.pending;
  const doneCount = item.checklist.filter((c) => c.done).length;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-stretch gap-0">
      {/* Time column */}
      <div className="w-20 shrink-0 flex flex-col items-end pe-4">
        <span className={cn('mt-5 font-mono text-sm font-semibold leading-none', isNow ? 'text-rose-600' : 'text-gray-600')}>
          {item.time}
        </span>
        <span className="mt-1 text-[10px] text-gray-400">{durLabel(item.duration)}</span>
      </div>

      {/* Connector column */}
      <div className="relative flex shrink-0 flex-col items-center w-5">
        {/* Top line segment */}
        <div className={cn('w-px flex-none', isFirst ? 'h-5 bg-transparent' : 'h-5 bg-gray-200')} />
        {/* Dot */}
        <div
          className={cn('relative z-10 h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-sm ring-2', isNow ? 'ring-rose-400' : 'ring-transparent')}
          style={{ backgroundColor: cat.dot }}
        />
        {/* Bottom line segment */}
        <div className={cn('w-px flex-1 min-h-4', isLast ? 'bg-transparent' : 'bg-gray-200')} />
      </div>

      {/* Card */}
      <div className="flex-1 ps-4 pb-3 pt-2 min-w-0">
        {/* Buffer warning */}
        {showBuffer && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-700">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {isHe ? 'פחות מ-15 דקות ממה שקדם לאירוע זה' : 'Less than 15 min gap from previous event'}
          </div>
        )}

        <div className={cn(
          'relative rounded-xl border bg-white shadow-sm transition-shadow',
          isNow && 'border-rose-300 shadow-rose-100 shadow-md',
          item.status === 'done' && 'opacity-60',
        )}>
          {/* Category color stripe */}
          <div className="absolute start-0 top-0 bottom-0 w-1 rounded-s-xl" style={{ backgroundColor: cat.dot }} />

          <div className="ps-4 pe-3 py-3">
            {/* Top row: badges + actions */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn('text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5', cat.color)}>
                  {isHe ? cat.he : cat.en}
                </span>
                {item.status !== 'pending' && (
                  <span className={cn('text-[10px] rounded-full px-2 py-0.5 font-medium', statusInfo.badge)}>
                    {isHe ? statusInfo.he : statusInfo.en}
                  </span>
                )}
                {isNow && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 animate-pulse">
                    <Radio className="h-2.5 w-2.5" /> NOW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button {...listeners} {...attributes} className="cursor-grab p-1 text-gray-300 hover:text-gray-500">
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button onClick={onEdit} className="rounded p-1 text-gray-300 hover:text-gray-600 transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={onDelete} className="rounded p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Title */}
            <p className={cn('font-semibold text-gray-900 leading-snug', item.status === 'done' && 'line-through text-gray-400')}>
              {item.title}
            </p>

            {/* Description + location */}
            {item.description && <p className="mt-0.5 text-xs text-gray-500 leading-snug">{item.description}</p>}
            {item.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" />{item.location}
              </p>
            )}

            {/* Vendor */}
            {item.vendor && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 border px-2.5 py-1.5 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700">{item.vendor.name}</span>
                  <span className="text-[10px] text-gray-400 ms-1.5">{item.vendor.category}</span>
                  {item.vendor.remainingBalance > 0 && (
                    <span className="block text-[10px] text-amber-600 font-medium mt-0.5">
                      ₪{item.vendor.remainingBalance.toLocaleString()} {isHe ? 'נותר לתשלום' : 'remaining'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {item.vendor.phone && (
                    <a href={`tel:${item.vendor.phone}`} title="Call" className="rounded p-1 text-gray-400 hover:bg-white hover:text-blue-600 transition-colors"><Phone className="h-3.5 w-3.5" /></a>
                  )}
                  {item.vendor.phone && (
                    <a href={`https://wa.me/${item.vendor.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="rounded p-1 text-gray-400 hover:bg-white hover:text-green-600 transition-colors"><MessageCircle className="h-3.5 w-3.5" /></a>
                  )}
                  {item.vendor.email && (
                    <a href={`mailto:${item.vendor.email}`} title="Email" className="rounded p-1 text-gray-400 hover:bg-white hover:text-rose-600 transition-colors"><Mail className="h-3.5 w-3.5" /></a>
                  )}
                </div>
              </div>
            )}

            {/* Checklist */}
            {item.checklist.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {doneCount}/{item.checklist.length} {isHe ? 'הושלמו' : 'done'}
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
            {expanded && (
              <div className="mt-1.5 space-y-1 ps-1">
                {item.checklist.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleCheck(item.id, c.id, !c.done)}
                    className="flex w-full items-center gap-2 text-start text-xs text-gray-700 hover:text-gray-900"
                  >
                    {c.done
                      ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      : <Square className="h-3.5 w-3.5 shrink-0 text-gray-300" />}
                    <span className={c.done ? 'line-through text-gray-400' : ''}>{c.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase divider ────────────────────────────────────────────────────────────

function PhaseDivider({ icon, label, isFirst }: { icon: string; label: string; isFirst: boolean }) {
  return (
    <div className="flex items-stretch gap-0">
      <div className="w-20 shrink-0" />
      <div className="relative flex shrink-0 flex-col items-center w-5">
        <div className={cn('w-px', isFirst ? 'h-4 bg-transparent' : 'h-4 bg-gray-200')} />
        <div className="z-10 flex h-6 w-6 -ms-0.5 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-sm shadow-sm">
          {icon}
        </div>
        <div className="w-px flex-1 bg-gray-200" />
      </div>
      <div className="flex-1 ps-4 flex items-center pb-1 pt-1">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-500">{label}</span>
      </div>
    </div>
  );
}

// ─── Now indicator ────────────────────────────────────────────────────────────

function NowIndicator() {
  return (
    <div className="flex items-center gap-0">
      <div className="w-20 shrink-0 pe-4 text-end">
        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Now</span>
      </div>
      <div className="shrink-0 w-5 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
      </div>
      <div className="flex-1 ps-4">
        <div className="h-px bg-rose-300 w-full" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScheduleTimeline({
  initialItems, vendors, weddingDate, coupleNames, locale: localeProp,
}: {
  initialItems: ScheduleItemFull[];
  vendors: VendorInfo[];
  weddingDate: Date | null;
  coupleNames: string;
  locale?: string;
}) {
  const [items, setItems] = useState<ScheduleItemFull[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItemFull | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [locale, setLocale] = useState(localeProp ?? 'en');
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });

  useEffect(() => {
    if (!localeProp) {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'he' || parts[1] === 'en') setLocale(parts[1]);
    }
  }, [localeProp]);

  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(id);
  }, []);

  const isHe = locale === 'he';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Sort by time for display
  const sorted = [...items].sort((a, b) => timeToMin(a.time) - timeToMin(b.time) || a.order - b.order);

  // Buffer warnings (events with < BUFFER_WARN gap from previous)
  const bufferWarnings = new Set<string>();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1], cur = sorted[i];
    const gap = timeToMin(cur.time) - (timeToMin(prev.time) + prev.duration);
    if (gap >= 0 && gap < BUFFER_WARN) bufferWarnings.add(cur.id);
  }

  // Phase tracking: remember which phases we've already shown a header for
  const seenPhases = new Set<string>();

  function itemToForm(item: ScheduleItemFull): FormState {
    return {
      time: item.time, duration: String(item.duration), title: item.title,
      description: item.description ?? '', location: item.location ?? '',
      category: item.category, vendorId: item.vendorId ?? '__none__',
      status: item.status, checklist: item.checklist,
    };
  }

  async function handleSave(form: FormState) {
    const vendor = vendors.find((v) => v.id === form.vendorId) ?? null;
    const payload = {
      time: form.time, duration: Math.max(1, parseInt(form.duration) || 60),
      title: form.title, description: form.description || null, location: form.location || null,
      category: form.category, vendorId: form.vendorId === '__none__' ? null : (form.vendorId || null),
      checklist: form.checklist, status: form.status,
    };
    const actionPayload = { ...payload, description: payload.description ?? undefined, location: payload.location ?? undefined };

    if (editingItem) {
      setItems((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...payload, vendor } : i));
      await updateScheduleItem(editingItem.id, actionPayload);
    } else {
      const created = await createScheduleItem({ ...actionPayload, order: items.length });
      setItems((prev) => [...prev, { ...created, vendor, checklist: created.checklist as ChecklistItem[] } as ScheduleItemFull]);
    }
    setEditingItem(null);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteScheduleItem(id);
  }

  async function handleToggleCheck(itemId: string, checkId: string, done: boolean) {
    setItems((prev) => prev.map((i) => {
      if (i.id !== itemId) return i;
      const checklist = i.checklist.map((c) => c.id === checkId ? { ...c, done } : c);
      updateScheduleItem(itemId, { checklist });
      return { ...i, checklist };
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      reorderScheduleItems(reordered.map((i) => i.id));
      return reordered;
    });
  }

  // Compute where "now" sits relative to the sorted list
  const nowAfterIndex = (() => {
    let idx = -1;
    for (let i = 0; i < sorted.length; i++) {
      if (timeToMin(sorted[i].time) <= nowMin) idx = i;
      else break;
    }
    return idx; // insert "now" line after this index (-1 = before all)
  })();
  const showNowLine = sorted.length > 0 && nowMin >= timeToMin(sorted[0].time) && nowMin <= timeToMin(sorted[sorted.length - 1].time) + sorted[sorted.length - 1].duration;

  return (
    <>
      {liveMode && <LiveMode items={items} onClose={() => setLiveMode(false)} />}
      {shareOpen && (
        <ShareDialog
          items={items} vendors={vendors} weddingDate={weddingDate}
          coupleNames={coupleNames} locale={locale} onClose={() => setShareOpen(false)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />{isHe ? 'הוסף אירוע' : 'Add Event'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="gap-1.5">
          <Share2 className="h-4 w-4" />{isHe ? 'שיתוף ויצוא' : 'Share & Export'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLiveMode(true)} className="gap-1.5 ms-auto">
          <Radio className="h-4 w-4 text-rose-500" />{isHe ? 'מצב חי' : 'Go Live'}
        </Button>
      </div>

      {/* Legend */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <span key={k} className={cn('flex items-center gap-1 text-[10px] font-medium border rounded-full px-2.5 py-0.5', v.color)}>
              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: v.dot }} />
              {isHe ? v.he : v.en}
            </span>
          ))}
        </div>
      )}

      {/* Timeline */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-400">{isHe ? 'אין אירועים. הוסף את האירוע הראשון!' : 'No events yet. Add your first event!'}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="relative select-none">
              {sorted.map((item, idx) => {
                const itemMin = timeToMin(item.time);
                const phase = PHASES.find((p) => itemMin < p.endMin) ?? PHASES[PHASES.length - 1];
                const showPhaseHeader = !seenPhases.has(phase.id) && (() => { seenPhases.add(phase.id); return true; })();
                const isNow = timeToMin(item.time) <= nowMin && nowMin < timeToMin(item.time) + item.duration;

                return (
                  <div key={item.id}>
                    {showPhaseHeader && (
                      <PhaseDivider
                        icon={phase.icon}
                        label={isHe ? phase.he : phase.en}
                        isFirst={idx === 0}
                      />
                    )}
                    {showNowLine && nowAfterIndex === idx - 1 && idx > 0 && <NowIndicator />}
                    <TimelineRow
                      item={item}
                      isNow={isNow}
                      showBuffer={bufferWarnings.has(item.id)}
                      onEdit={() => { setEditingItem(item); setDialogOpen(true); }}
                      onDelete={() => handleDelete(item.id)}
                      onToggleCheck={handleToggleCheck}
                      locale={locale}
                      isFirst={idx === 0 && !seenPhases.size}
                      isLast={idx === sorted.length - 1}
                    />
                    {showNowLine && nowAfterIndex === idx && idx === sorted.length - 1 && <NowIndicator />}
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <EventDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        initial={editingItem ? itemToForm(editingItem) : undefined}
        vendors={vendors}
        locale={locale}
      />
    </>
  );
}
