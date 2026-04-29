'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Pencil, Check, X, Copy,
  Building2, Tag, Camera, Video, Music2, Flower2,
  Car, Sparkles, Scissors, ShoppingBag, Briefcase,
  UtensilsCrossed, Mail, Cake, Users, Loader2,
  LayoutGrid, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createForecastBoard,
  renameForecastBoard,
  deleteForecastBoard,
  duplicateForecastBoard,
  addForecastItem,
  updateForecastItem,
  deleteForecastItem,
} from '@/actions/forecast';

// ── Types ─────────────────────────────────────────────────────────────────────

type ForecastItemData = {
  id: string;
  name: string;
  isVenue: boolean;
  cost: number;
  pricePerGuest: number;
  numGuests: number;
};

type ForecastBoardData = {
  id: string;
  name: string;
  items: ForecastItemData[];
};

// ── Icon / color maps (English + Hebrew names) ────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  // English
  Venue: Building2, Photography: Camera, Videography: Video,
  DJ: Music2, Music: Music2, Makeup: Sparkles, Hair: Scissors,
  Dress: ShoppingBag, Suit: Briefcase, Catering: UtensilsCrossed,
  Transportation: Car, Invitations: Mail, Flowers: Flower2, Cake: Cake,
  // Hebrew
  'אולם': Building2, 'צלמות': Camera, 'וידאוגרפיה': Video,
  'איפור': Sparkles, 'שיער': Scissors, 'שמלה': ShoppingBag,
  'חליפה': Briefcase, 'קייטרינג': UtensilsCrossed,
  'הסעות': Car, 'הזמנות': Mail, 'פרחים': Flower2, 'עוגה': Cake,
};

const CATEGORY_COLORS: Record<string, string> = {
  // English
  Venue: 'bg-rose-50 text-rose-600', Photography: 'bg-violet-50 text-violet-600',
  Videography: 'bg-blue-50 text-blue-600', DJ: 'bg-pink-50 text-pink-600',
  Music: 'bg-pink-50 text-pink-600', Makeup: 'bg-fuchsia-50 text-fuchsia-600',
  Hair: 'bg-amber-50 text-amber-600', Dress: 'bg-purple-50 text-purple-600',
  Suit: 'bg-slate-50 text-slate-600', Catering: 'bg-orange-50 text-orange-600',
  Transportation: 'bg-cyan-50 text-cyan-600', Invitations: 'bg-teal-50 text-teal-600',
  Flowers: 'bg-green-50 text-green-600', Cake: 'bg-yellow-50 text-yellow-600',
  // Hebrew
  'אולם': 'bg-rose-50 text-rose-600', 'צלמות': 'bg-violet-50 text-violet-600',
  'וידאוגרפיה': 'bg-blue-50 text-blue-600',
  'איפור': 'bg-fuchsia-50 text-fuchsia-600', 'שיער': 'bg-amber-50 text-amber-600',
  'שמלה': 'bg-purple-50 text-purple-600', 'חליפה': 'bg-slate-50 text-slate-600',
  'קייטרינג': 'bg-orange-50 text-orange-600', 'הסעות': 'bg-cyan-50 text-cyan-600',
  'הזמנות': 'bg-teal-50 text-teal-600', 'פרחים': 'bg-green-50 text-green-600',
  'עוגה': 'bg-yellow-50 text-yellow-600',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function itemTotal(item: ForecastItemData): number {
  if (item.isVenue) return item.pricePerGuest * item.numGuests;
  return item.cost;
}

function boardTotal(items: ForecastItemData[]): number {
  return items.reduce((s, i) => s + itemTotal(i), 0);
}

function fmt(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── Board list card ───────────────────────────────────────────────────────────

function BoardCard({
  board,
  onOpen,
  onDelete,
  onDuplicate,
}: {
  board: ForecastBoardData;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRtl = locale === 'he';
  const total = boardTotal(board.items);
  const OpenChevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <Card
      className="group relative cursor-pointer transition-shadow hover:shadow-lg"
      onClick={onOpen}
    >
      <CardContent className="p-5">
        {/* Action buttons — top end corner */}
        <div className="absolute end-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-blue-50 hover:text-blue-500"
            title={t('fDuplicateBoard')}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"
            title={t('fDeleteBoard')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="me-6 truncate font-semibold text-gray-900">{board.name}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          {t('fVendorCount', { count: board.items.length })}
        </p>

        <div className="mt-4">
          <p className="text-2xl font-bold tabular-nums text-gray-900">{fmt(total)}</p>
          <p className="text-xs text-gray-400">{t('fTotalEstimatedShort')}</p>
        </div>

        {board.items.length > 0 && (
          <div className="mt-3 space-y-1">
            {board.items.slice(0, 3).map((item) => {
              const Icon = CATEGORY_ICONS[item.name] ?? (item.isVenue ? Building2 : Tag);
              return (
                <div key={item.id} className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="shrink-0 tabular-nums">{fmt(itemTotal(item))}</span>
                </div>
              );
            })}
            {board.items.length > 3 && (
              <p className="text-xs text-gray-400">+{board.items.length - 3}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-rose-500">
          <span>{t('fOpenBoard')}</span>
          <OpenChevron className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Board detail ──────────────────────────────────────────────────────────────

function BoardDetail({
  board: initialBoard,
  onBack,
}: {
  board: ForecastBoardData;
  onBack: (updated: ForecastBoardData) => void;
}) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRtl = locale === 'he';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const [items, setItems] = useState<ForecastItemData[]>(initialBoard.items);
  const [boardName, setBoardName] = useState(initialBoard.name);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editPricePerGuest, setEditPricePerGuest] = useState('');
  const [editNumGuests, setEditNumGuests] = useState('');
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addIsVenue, setAddIsVenue] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addPricePerGuest, setAddPricePerGuest] = useState('');
  const [addNumGuests, setAddNumGuests] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const total = boardTotal(items);
  const hasVenue = items.some((i) => i.isVenue);

  const PRESET_VENDORS = [
    t('fPresetPhotography'), t('fPresetVideography'), t('fPresetDJ'),
    t('fPresetCatering'), t('fPresetFlowers'), t('fPresetCake'),
    t('fPresetMakeup'), t('fPresetHair'), t('fPresetDress'),
    t('fPresetSuit'), t('fPresetTransportation'), t('fPresetInvitations'),
  ];

  async function saveName() {
    if (!boardName.trim()) return;
    setSavingName(true);
    try {
      await renameForecastBoard(initialBoard.id, boardName);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }

  function startEditItem(item: ForecastItemData) {
    setEditingItemId(item.id);
    if (item.isVenue) {
      setEditPricePerGuest(item.pricePerGuest.toString());
      setEditNumGuests(item.numGuests.toString());
    } else {
      setEditCost(item.cost.toString());
    }
  }

  async function saveItemEdit(item: ForecastItemData) {
    let patch: { cost?: number; pricePerGuest?: number; numGuests?: number };
    if (item.isVenue) {
      const ppg = parseFloat(editPricePerGuest) || 0;
      const ng = parseInt(editNumGuests) || 0;
      patch = { pricePerGuest: ppg, numGuests: ng };
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, pricePerGuest: ppg, numGuests: ng } : i));
    } else {
      const cost = parseFloat(editCost) || 0;
      patch = { cost };
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, cost } : i));
    }
    setEditingItemId(null);
    setSavingItemId(item.id);
    try {
      await updateForecastItem(item.id, patch);
    } finally {
      setSavingItemId(null);
    }
  }

  function cancelItemEdit() {
    setEditingItemId(null);
    setEditCost('');
    setEditPricePerGuest('');
    setEditNumGuests('');
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteForecastItem(id);
  }

  async function handleAdd() {
    if (!addName.trim()) return;
    setAddLoading(true);
    try {
      const created = await addForecastItem(initialBoard.id, {
        name: addName.trim(),
        isVenue: addIsVenue,
        cost: addIsVenue ? 0 : (parseFloat(addCost) || 0),
        pricePerGuest: addIsVenue ? (parseFloat(addPricePerGuest) || 0) : 0,
        numGuests: addIsVenue ? (parseInt(addNumGuests) || 0) : 0,
      });
      setItems((prev) => [...prev, created]);
      setAddName(''); setAddCost(''); setAddPricePerGuest(''); setAddNumGuests('');
      setAddIsVenue(false);
      setShowAddForm(false);
    } finally {
      setAddLoading(false);
    }
  }

  function resetAddForm() {
    setShowAddForm(false);
    setAddName(''); setAddCost(''); setAddPricePerGuest(''); setAddNumGuests('');
    setAddIsVenue(false);
  }

  const availablePresets = PRESET_VENDORS.filter((p) => !items.some((i) => i.name === p));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" onClick={() => onBack({ ...initialBoard, name: boardName, items })} className="shrink-0">
          <BackArrow className="me-1.5 h-4 w-4" />
          {t('fAllBoards')}
        </Button>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') { setEditingName(false); setBoardName(initialBoard.name); }
                }}
                autoFocus
                className="h-8 text-lg font-semibold"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={saveName} disabled={savingName}>
                {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0"
                onClick={() => { setEditingName(false); setBoardName(initialBoard.name); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button className="group flex items-center gap-2 text-start" onClick={() => setEditingName(true)}>
              <h2 className="truncate font-serif text-2xl font-bold text-gray-900">{boardName}</h2>
              <Pencil className="h-4 w-4 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
      </div>

      {/* Grand total banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-5 ring-1 ring-rose-200/60">
        <div>
          <p className="text-sm font-medium text-gray-500">{t('fTotalEstimated')}</p>
          <p className="mt-0.5 text-4xl font-bold tabular-nums text-gray-900">{fmt(total)}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {hasVenue && (
            <div>
              <p className="text-xs text-gray-400">{t('fVenue')}</p>
              <p className="font-semibold tabular-nums text-gray-700">
                {fmt(items.filter((i) => i.isVenue).reduce((s, i) => s + itemTotal(i), 0))}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">{t('fOtherVendors')}</p>
            <p className="font-semibold tabular-nums text-gray-700">
              {fmt(items.filter((i) => !i.isVenue).reduce((s, i) => s + itemTotal(i), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Venue card (special) */}
      {items.filter((i) => i.isVenue).map((item) => {
        const isEditing = editingItemId === item.id;
        const computed = item.pricePerGuest * item.numGuests;

        return (
          <Card key={item.id} className="border-rose-100 bg-rose-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{t('fVenueFormula')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600"
                      onClick={() => startEditItem(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-500"
                    onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('fPricePerGuest')}</Label>
                      <Input type="number" min="0" value={editPricePerGuest} autoFocus
                        onChange={(e) => setEditPricePerGuest(e.target.value)}
                        placeholder={t('fPricePlaceholder')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('fNumGuests')}</Label>
                      <Input type="number" min="0" value={editNumGuests}
                        onChange={(e) => setEditNumGuests(e.target.value)}
                        placeholder={t('fGuestsPlaceholder')}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveItemEdit(item); if (e.key === 'Escape') cancelItemEdit(); }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {t('fVenueTotal')}:{' '}
                      <span className="font-bold text-gray-900">
                        {fmt((parseFloat(editPricePerGuest) || 0) * (parseInt(editNumGuests) || 0))}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveItemEdit(item)}>
                        <Check className="me-1.5 h-3.5 w-3.5" />{t('fSave')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelItemEdit}>{t('fCancel')}</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-xs text-gray-400">{t('fPricePerGuestShort')}</p>
                    <p className="text-lg font-semibold tabular-nums text-gray-800">{fmt(item.pricePerGuest)}</p>
                  </div>
                  <span className="mb-1 text-lg text-gray-400">×</span>
                  <div>
                    <p className="text-xs text-gray-400">{t('fGuestsShort')}</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-lg font-semibold tabular-nums text-gray-800">{item.numGuests}</p>
                    </div>
                  </div>
                  <span className="mb-1 text-lg text-gray-400">=</span>
                  <div>
                    <p className="text-xs text-gray-400">{t('fVenueTotal')}</p>
                    <p className="text-2xl font-bold tabular-nums text-rose-600">{fmt(computed)}</p>
                  </div>
                  {savingItemId === item.id && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Vendor cards grid */}
      {items.filter((i) => !i.isVenue).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.filter((i) => !i.isVenue).map((item) => {
            const Icon = CATEGORY_ICONS[item.name] ?? Tag;
            const colorClass = CATEGORY_COLORS[item.name] ?? 'bg-gray-50 text-gray-500';
            const isEditing = editingItemId === item.id;

            return (
              <Card key={item.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{item.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-gray-300 hover:text-red-500"
                      onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <Input type="number" min="0" value={editCost} autoFocus className="h-8 text-sm"
                          onChange={(e) => setEditCost(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveItemEdit(item); if (e.key === 'Escape') cancelItemEdit(); }} />
                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => saveItemEdit(item)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={cancelItemEdit}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button className="group flex cursor-pointer items-baseline gap-2" onClick={() => startEditItem(item)}>
                        <span className="text-2xl font-bold tabular-nums text-gray-900">{fmt(item.cost)}</span>
                        <Pencil className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                        {savingItemId === item.id && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                      </button>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">{t('fEstimated')}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add item form */}
      {showAddForm ? (
        <Card className="border-2 border-dashed border-rose-200 bg-rose-50/20">
          <CardContent className="space-y-4 p-5">
            {/* Type toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setAddIsVenue(false); if (addName === t('fVenue')) setAddName(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${!addIsVenue ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {t('fVendorService')}
              </button>
              <button
                onClick={() => { setAddIsVenue(true); setAddName(t('fVenue')); }}
                disabled={hasVenue}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${addIsVenue ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Building2 className="me-1.5 inline h-3.5 w-3.5" />
                {t('fVenue')}
              </button>
            </div>

            {addIsVenue ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t('fVenueName')}</Label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)}
                    placeholder={t('fVenueNamePlaceholder')} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t('fPricePerGuestILS')}</Label>
                    <Input type="number" min="0" value={addPricePerGuest}
                      onChange={(e) => setAddPricePerGuest(e.target.value)}
                      placeholder={t('fPricePlaceholder')} />
                  </div>
                  <div>
                    <Label className="text-xs">{t('fNumGuestsLabel')}</Label>
                    <Input type="number" min="0" value={addNumGuests}
                      onChange={(e) => setAddNumGuests(e.target.value)}
                      placeholder={t('fGuestsPlaceholder')}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
                  </div>
                </div>
                {addPricePerGuest && addNumGuests && (
                  <p className="text-sm text-gray-600">
                    {t('fVenueTotalLabel')}{' '}
                    <span className="font-bold text-rose-600">
                      {fmt((parseFloat(addPricePerGuest) || 0) * (parseInt(addNumGuests) || 0))}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">{t('fVendorName')}</Label>
                  <Input value={addName} onChange={(e) => setAddName(e.target.value)}
                    placeholder={t('fVendorNamePlaceholder')} autoFocus />
                </div>
                <div>
                  <Label className="text-xs">{t('fEstimatedCostILS')}</Label>
                  <Input type="number" min="0" value={addCost}
                    onChange={(e) => setAddCost(e.target.value)}
                    placeholder="0"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
                </div>
                {availablePresets.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availablePresets.slice(0, 8).map((p) => (
                      <button key={p} onClick={() => setAddName(p)}
                        className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-rose-100 hover:text-rose-700 hover:ring-rose-200">
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleAdd}
                disabled={addLoading || !addName.trim()}>
                {addLoading
                  ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                  : <Plus className="me-1.5 h-4 w-4" />}
                {t('fAdd')}
              </Button>
              <Button variant="outline" onClick={resetAddForm}>{t('fCancel')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-400 transition-colors hover:border-rose-300 hover:bg-rose-50/30 hover:text-rose-500"
        >
          <Plus className="h-4 w-4" />
          {t('fAddVendorService')}
        </button>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function ForecastView({ boards: initialBoards }: { boards: ForecastBoardData[] }) {
  const t = useTranslations('dashboard');
  const [boards, setBoards] = useState<ForecastBoardData[]>(initialBoards);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) ?? null;

  const BOARD_NAME_PRESETS = [
    t('fPresetOption1'), t('fPresetOption2'), t('fPresetGardenVenue'),
    t('fPresetCityHall'), t('fPreset250Guests'), t('fPresetWinter'),
  ];

  async function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setCreatingBoard(true);
    try {
      const created = await createForecastBoard(newBoardName.trim());
      setBoards((prev) => [...prev, created]);
      setNewBoardName('');
      setShowNewBoardForm(false);
      setSelectedBoardId(created.id);
    } finally {
      setCreatingBoard(false);
    }
  }

  async function handleDeleteBoard(boardId: string) {
    if (selectedBoardId === boardId) setSelectedBoardId(null);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    await deleteForecastBoard(boardId);
  }

  async function handleDuplicateBoard(boardId: string) {
    const copy = await duplicateForecastBoard(boardId);
    setBoards((prev) => [
      ...prev,
      {
        id: copy.id,
        name: copy.name,
        items: copy.items.map((i) => ({
          id: i.id,
          name: i.name,
          isVenue: i.isVenue,
          cost: i.cost,
          pricePerGuest: i.pricePerGuest,
          numGuests: i.numGuests,
        })),
      },
    ]);
  }

  if (selectedBoard) {
    return (
      <BoardDetail
        board={selectedBoard}
        onBack={(updated) => {
            setBoards((prev) => prev.map((b) => b.id === updated.id ? updated : b));
            setSelectedBoardId(null);
          }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {boards.length === 0 && !showNewBoardForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <LayoutGrid className="h-6 w-6 text-rose-400" />
          </div>
          <p className="text-base font-medium text-gray-700">{t('fNoBoards')}</p>
          <p className="mt-1 max-w-sm text-sm text-gray-400">{t('fNoBoardsDesc')}</p>
          <Button className="mt-6 bg-rose-500 hover:bg-rose-600" onClick={() => setShowNewBoardForm(true)}>
            <Plus className="me-2 h-4 w-4" />
            {t('fCreateFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onOpen={() => setSelectedBoardId(board.id)}
              onDelete={() => handleDeleteBoard(board.id)}
              onDuplicate={() => handleDuplicateBoard(board.id)}
            />
          ))}

          {showNewBoardForm ? (
            <Card className="border-2 border-dashed border-rose-200 bg-rose-50/20">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-medium text-gray-700">{t('fNewBoardTitle')}</p>
                <Input
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder={t('fBoardNamePlaceholder')}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBoard();
                    if (e.key === 'Escape') { setShowNewBoardForm(false); setNewBoardName(''); }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {BOARD_NAME_PRESETS.map((s) => (
                    <button key={s} onClick={() => setNewBoardName(s)}
                      className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-rose-100 hover:text-rose-700 hover:ring-rose-200">
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-rose-500 hover:bg-rose-600" onClick={handleCreateBoard}
                    disabled={creatingBoard || !newBoardName.trim()}>
                    {creatingBoard
                      ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
                      : <Plus className="me-1.5 h-4 w-4" />}
                    {t('fCreate')}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowNewBoardForm(false); setNewBoardName(''); }}>
                    {t('fCancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              onClick={() => setShowNewBoardForm(true)}
              className="flex min-h-[200px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm text-gray-400 transition-colors hover:border-rose-300 hover:bg-rose-50/30 hover:text-rose-500"
            >
              <Plus className="h-4 w-4" />
              {t('fNewBoard')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
