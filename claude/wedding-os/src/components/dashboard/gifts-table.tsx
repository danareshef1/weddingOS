'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Download, Search, Check, Clock,
  Users, Banknote, TrendingUp, StickyNote, X,
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
import { createGiftEntry, updateGiftEntry, deleteGiftEntry } from '@/actions/gifts';
import type { GiftEntryInput } from '@/actions/gifts';

// ─── Types ────────────────────────────────────────────────────────────────────

type GiftEntry = {
  id: string; guestId: string | null; guestName: string; attendeeCount: number;
  amount: number; method: string; status: string; notes: string | null;
  receivedAt: Date | null; createdAt: Date;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const METHODS: Record<string, { en: string; he: string; color: string }> = {
  CASH:          { en: 'Cash',          he: 'מזומן',         color: 'bg-green-100 text-green-700 border-green-200' },
  CHECK:         { en: 'Check',         he: "צ'ק",           color: 'bg-blue-100 text-blue-700 border-blue-200' },
  BANK_TRANSFER: { en: 'Bank Transfer', he: 'העברה בנקאית',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
  BIT:           { en: 'Bit',           he: 'ביט',           color: 'bg-orange-100 text-orange-700 border-orange-200' },
  ONLINE:        { en: 'Online / App',  he: 'תשלום אונליין', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ entries, isHe }: { entries: GiftEntry[]; isHe: boolean }) {
  const received   = entries.filter((e) => e.status === 'RECEIVED');
  const pending    = entries.filter((e) => e.status === 'PENDING');
  const totalRec   = received.reduce((s, e) => s + e.amount, 0);
  const totalPend  = pending.reduce((s, e) => s + e.amount, 0);
  const totalPpl   = received.reduce((s, e) => s + e.attendeeCount, 0);
  const avgEntry   = received.length > 0 ? totalRec / received.length : 0;
  const avgPerson  = totalPpl > 0 ? totalRec / totalPpl : 0;

  const methodTotals = Object.keys(METHODS)
    .map((m) => ({ method: m, total: received.filter((e) => e.method === m).reduce((s, e) => s + e.amount, 0) }))
    .filter((x) => x.total > 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Banknote className="h-4 w-4 text-emerald-600" />, label: isHe ? 'התקבל' : 'Received', value: `₪${totalRec.toLocaleString()}`, sub: `${received.length} / ${entries.length} ${isHe ? 'מעטפות' : 'envelopes'}`, color: 'border-emerald-200 bg-emerald-50' },
          { icon: <Clock className="h-4 w-4 text-amber-600" />, label: isHe ? 'ממתין' : 'Pending', value: `₪${totalPend.toLocaleString()}`, sub: `${pending.length} ${isHe ? 'מעטפות' : 'envelopes'}`, color: 'border-amber-200 bg-amber-50' },
          { icon: <TrendingUp className="h-4 w-4 text-blue-600" />, label: isHe ? 'ממוצע למשפחה' : 'Avg / entry', value: `₪${Math.round(avgEntry).toLocaleString()}`, sub: isHe ? 'מתוך שהתקבלו' : 'received only', color: 'border-blue-200 bg-blue-50' },
          { icon: <Users className="h-4 w-4 text-violet-600" />, label: isHe ? 'ממוצע לאורח' : 'Avg / person', value: `₪${Math.round(avgPerson).toLocaleString()}`, sub: `${totalPpl} ${isHe ? 'משלמים' : 'paid attendees'}`, color: 'border-violet-200 bg-violet-50' },
        ].map((c, i) => (
          <div key={i} className={cn('rounded-xl border p-4 space-y-1', c.color)}>
            <div className="flex items-center gap-2">{c.icon}<span className="text-xs text-gray-500">{c.label}</span></div>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-[11px] text-gray-500">{c.sub}</p>
          </div>
        ))}
      </div>

      {methodTotals.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-4 py-3">
          <span className="text-xs text-gray-500 font-medium self-center me-1">
            {isHe ? 'לפי שיטה:' : 'By method:'}
          </span>
          {methodTotals.map(({ method, total }) => (
            <span key={method} className={cn('rounded-full border px-3 py-0.5 text-[11px] font-medium', METHODS[method]?.color)}>
              {isHe ? METHODS[method]?.he : METHODS[method]?.en} · ₪{total.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline amount cell ───────────────────────────────────────────────────────

function AmountCell({ entry, onUpdate }: { entry: GiftEntry; onUpdate: (amount: number) => void }) {
  const [val, setVal] = useState(entry.amount > 0 ? String(entry.amount) : '');

  return (
    <div className="relative flex items-center">
      <span className="absolute start-2 text-sm text-gray-400 pointer-events-none">₪</span>
      <input
        type="number"
        min={0}
        step={50}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onUpdate(parseFloat(val) || 0)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        placeholder="0"
        className="w-28 rounded-lg border border-transparent bg-transparent ps-7 pe-2 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-200 hover:bg-gray-50 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
      />
    </div>
  );
}

// ─── Inline method select ─────────────────────────────────────────────────────

function MethodCell({ entry, isHe, onUpdate }: { entry: GiftEntry; isHe: boolean; onUpdate: (method: string) => void }) {
  const m = METHODS[entry.method] ?? METHODS.CASH;
  return (
    <Select value={entry.method} onValueChange={onUpdate}>
      <SelectTrigger className={cn('h-7 w-36 border rounded-full px-3 text-[11px] font-medium', m.color)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(METHODS).map(([k, v]) => (
          <SelectItem key={k} value={k} className="text-sm">{isHe ? v.he : v.en}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Notes popover ────────────────────────────────────────────────────────────

function NotesCell({ entry, isHe, onUpdate }: { entry: GiftEntry; isHe: boolean; onUpdate: (notes: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(entry.notes ?? '');

  function save() {
    onUpdate(val);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition-colors',
          entry.notes ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50',
        )}
        title={entry.notes ?? (isHe ? 'הוסף הערה' : 'Add note')}
      >
        <StickyNote className="h-3.5 w-3.5" />
        {entry.notes && <span className="max-w-20 truncate">{entry.notes}</span>}
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{isHe ? 'הערה' : 'Note'} — {entry.guestName}</DialogTitle>
          </DialogHeader>
          <textarea
            rows={3}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={isHe ? "לדוגמה: צ'ק מס' 1234, הבטיח להעביר" : "e.g. Check #1234, promised to transfer"}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>{isHe ? 'ביטול' : 'Cancel'}</Button>
            <Button size="sm" onClick={save}>{isHe ? 'שמירה' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add external guest dialog ────────────────────────────────────────────────

type ExternalForm = { guestName: string; attendeeCount: string; amount: string; method: string; notes: string };
const EMPTY: ExternalForm = { guestName: '', attendeeCount: '1', amount: '', method: 'CASH', notes: '' };

function AddExternalDialog({ open, onClose, onSave, isHe }: {
  open: boolean; onClose: () => void; onSave: (f: ExternalForm) => Promise<void>; isHe: boolean;
}) {
  const [form, setForm] = useState<ExternalForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  function set(k: keyof ExternalForm, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!form.guestName.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setForm(EMPTY);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isHe ? 'הוסף אורח חיצוני' : 'Add External Guest'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>{isHe ? 'שם *' : 'Name *'}</Label>
            <Input value={form.guestName} onChange={(e) => set('guestName', e.target.value)} placeholder={isHe ? 'לדוגמה: משפחת לוי' : 'e.g. Levy family'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isHe ? 'מספר אורחים' : 'Attendees'}</Label>
              <Input type="number" min={1} max={50} value={form.attendeeCount} onChange={(e) => set('attendeeCount', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{isHe ? 'סכום (₪)' : 'Amount (₪)'}</Label>
              <Input type="number" min={0} step={50} value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'אמצעי תשלום' : 'Payment Method'}</Label>
            <Select value={form.method} onValueChange={(v) => set('method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(METHODS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{isHe ? v.he : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{isHe ? 'הערות' : 'Notes'}</Label>
            <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={isHe ? "צ'ק, ביט..." : 'Check, Bit...'} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{isHe ? 'ביטול' : 'Cancel'}</Button>
          <Button onClick={handleSave} disabled={saving || !form.guestName.trim()}>{isHe ? 'הוסף' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GiftsTable({
  initialEntries,
  locale: localeProp,
}: {
  initialEntries: GiftEntry[];
  locale?: string;
}) {
  const [entries, setEntries] = useState<GiftEntry[]>(initialEntries);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'amount_desc' | 'amount_asc'>('name');
  const locale = localeProp ?? 'en';
  const isHe = locale === 'he';

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) list = list.filter((e) => e.guestName.toLowerCase().includes(search.toLowerCase()));
    if (filterMethod !== 'ALL') list = list.filter((e) => e.method === filterMethod);
    if (filterStatus !== 'ALL') list = list.filter((e) => e.status === filterStatus);
    list.sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc')  return a.amount - b.amount;
      return a.guestName.localeCompare(b.guestName);
    });
    return list;
  }, [entries, search, filterMethod, filterStatus, sortBy]);

  async function patchEntry(id: string, patch: Partial<GiftEntryInput>) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
    await updateGiftEntry(id, patch);
  }

  async function handleToggleStatus(entry: GiftEntry) {
    const status = entry.status === 'RECEIVED' ? 'PENDING' : 'RECEIVED';
    await patchEntry(entry.id, { status: status as 'RECEIVED' | 'PENDING' });
  }

  async function handleAddExternal(form: ExternalForm) {
    const data: GiftEntryInput = {
      guestName: form.guestName.trim(),
      attendeeCount: Math.max(1, parseInt(form.attendeeCount) || 1),
      amount: parseFloat(form.amount) || 0,
      method: form.method as GiftEntryInput['method'],
      status: 'PENDING',
      notes: form.notes.trim() || undefined,
    };
    const created = await createGiftEntry(data);
    setEntries((prev) => [...prev, created as unknown as GiftEntry]);
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteGiftEntry(id);
  }

  return (
    <div className="space-y-6">
      <SummaryBar entries={entries} isHe={isHe} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setAddOpen(true)} variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {isHe ? 'הוסף אורח חיצוני' : 'Add External Guest'}
        </Button>
        <a href="/api/gifts/export" className="ms-auto">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            {isHe ? 'ייצא CSV' : 'Export CSV'}
          </Button>
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input className="ps-9" placeholder={isHe ? 'חיפוש לפי שם...' : 'Search by name...'} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-40"><SelectValue placeholder={isHe ? 'שיטת תשלום' : 'Method'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{isHe ? 'כל השיטות' : 'All methods'}</SelectItem>
            {Object.entries(METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{isHe ? v.he : v.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{isHe ? 'הכל' : 'All'}</SelectItem>
            <SelectItem value="RECEIVED">{isHe ? 'התקבל' : 'Received'}</SelectItem>
            <SelectItem value="PENDING">{isHe ? 'ממתין' : 'Pending'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{isHe ? 'מיין לפי שם' : 'Sort: name'}</SelectItem>
            <SelectItem value="amount_desc">{isHe ? 'סכום: גבוה→נמוך' : 'Amount: high–low'}</SelectItem>
            <SelectItem value="amount_asc">{isHe ? 'סכום: נמוך→גבוה' : 'Amount: low–high'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Banknote className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-400">
            {entries.length === 0
              ? (isHe ? 'ממתין לאורחים שיאשרו הגעה' : 'Waiting for guests to confirm attendance')
              : (isHe ? 'אין תוצאות לסינון זה' : 'No results for this filter')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'אורח' : 'Guest'}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'אורחים' : 'Ppl'}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'סכום' : 'Amount'}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'שיטה' : 'Method'}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'סטטוס' : 'Status'}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{isHe ? 'הערות' : 'Notes'}</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'group transition-colors hover:bg-gray-50/60',
                    entry.status === 'RECEIVED' && entry.amount > 0 && 'bg-emerald-50/20',
                  )}
                >
                  {/* Name */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{entry.guestName}</p>
                      {!entry.guestId && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                          {isHe ? 'חיצוני' : 'external'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Attendees (read-only) */}
                  <td className="px-4 py-2.5 text-center text-gray-500">{entry.attendeeCount}</td>

                  {/* Amount — inline editable */}
                  <td className="px-4 py-2.5">
                    <AmountCell
                      entry={entry}
                      onUpdate={(amount) => patchEntry(entry.id, { amount })}
                    />
                  </td>

                  {/* Method — inline select */}
                  <td className="px-4 py-2.5">
                    <MethodCell
                      entry={entry}
                      isHe={isHe}
                      onUpdate={(method) => patchEntry(entry.id, { method: method as GiftEntryInput['method'] })}
                    />
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleToggleStatus(entry)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                        entry.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                      )}
                    >
                      {entry.status === 'RECEIVED'
                        ? <><Check className="h-3 w-3" />{isHe ? 'התקבל' : 'Received'}</>
                        : <><Clock className="h-3 w-3" />{isHe ? 'ממתין' : 'Pending'}</>}
                    </button>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-2.5">
                    <NotesCell
                      entry={entry}
                      isHe={isHe}
                      onUpdate={(notes) => patchEntry(entry.id, { notes })}
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded p-1.5 text-gray-200 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer totals */}
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">
                  {filtered.length} {isHe ? 'רשומות' : 'entries'}
                </td>
                <td className="px-4 py-2.5 text-center text-xs text-gray-600">
                  {filtered.reduce((s, e) => s + e.attendeeCount, 0)}
                </td>
                <td className="px-4 py-2.5 text-xs font-bold text-gray-900">
                  ₪{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <AddExternalDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAddExternal} isHe={isHe} />
    </div>
  );
}
