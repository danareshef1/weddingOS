'use client';

import { useState } from 'react';
import {
  Camera, Video, Music2, Flower2, Car, Sparkles,
  Scissors, ShoppingBag, Briefcase, UtensilsCrossed,
  Mail, Tag, Cake, Plus, Pencil, Trash2, Check, X, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateBudgetItem, deleteBudgetItem, createBudgetItem } from '@/actions/budget';

type Item = {
  id: string;
  category: string;
  vendor: string | null;
  estimated: number;
  actual: number;
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Photography: Camera,
  Videography: Video,
  DJ: Music2,
  Music: Music2,
  Makeup: Sparkles,
  Hair: Scissors,
  Dress: ShoppingBag,
  Suit: Briefcase,
  Catering: UtensilsCrossed,
  Transportation: Car,
  Invitations: Mail,
  Flowers: Flower2,
  Cake: Cake,
};

const CATEGORY_COLORS: Record<string, string> = {
  Photography: 'bg-violet-50 text-violet-600',
  Videography: 'bg-blue-50 text-blue-600',
  DJ: 'bg-pink-50 text-pink-600',
  Music: 'bg-pink-50 text-pink-600',
  Makeup: 'bg-rose-50 text-rose-600',
  Hair: 'bg-amber-50 text-amber-600',
  Dress: 'bg-purple-50 text-purple-600',
  Suit: 'bg-slate-50 text-slate-600',
  Catering: 'bg-orange-50 text-orange-600',
  Transportation: 'bg-cyan-50 text-cyan-600',
  Invitations: 'bg-teal-50 text-teal-600',
  Flowers: 'bg-green-50 text-green-600',
  Cake: 'bg-yellow-50 text-yellow-600',
};

const PRESET_CATEGORIES = [
  'Photography', 'Videography', 'DJ', 'Catering',
  'Flowers', 'Cake', 'Makeup', 'Hair', 'Dress',
  'Suit', 'Transportation', 'Invitations',
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface VendorBudgetGridProps {
  items: Item[];
  venueTotal: number;
  budgetLabel: string;
  venueLabel: string;
  otherVendorsLabel: string;
  estimatedLabel: string;
  addVendorLabel: string;
  cancelLabel: string;
  vendorNamePlaceholder: string;
  estimatedPlaceholder: string;
}

export function VendorBudgetGrid({
  items: initialItems,
  venueTotal,
  budgetLabel,
  venueLabel,
  otherVendorsLabel,
  estimatedLabel,
  addVendorLabel,
  cancelLabel,
  vendorNamePlaceholder,
  estimatedPlaceholder,
}: VendorBudgetGridProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newEstimated, setNewEstimated] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  const nonVenueTotal = items.reduce((s, i) => s + i.estimated, 0);
  const grandTotal = nonVenueTotal + venueTotal;

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditValue(item.estimated.toString());
  }

  async function saveEdit(id: string) {
    const newEstimatedVal = parseFloat(editValue) || 0;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, estimated: newEstimatedVal } : i));
    setEditingId(null);
    setSavingId(id);
    try {
      await updateBudgetItem(id, { estimated: newEstimatedVal });
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteBudgetItem(id);
  }

  async function handleAdd() {
    if (!newCategory.trim()) return;
    setAddingLoading(true);
    const estimated = parseFloat(newEstimated) || 0;
    try {
      const created = await createBudgetItem({ category: newCategory.trim(), estimated });
      setItems((prev) => [
        ...prev,
        {
          id: created.id,
          category: created.category,
          vendor: created.vendor,
          estimated: created.estimated,
          actual: created.actual,
        },
      ]);
      setNewCategory('');
      setNewEstimated('');
      setShowAddForm(false);
    } finally {
      setAddingLoading(false);
    }
  }

  const availablePresets = PRESET_CATEGORIES.filter(
    (c) => !items.some((i) => i.category === c),
  );

  return (
    <div className="space-y-4">
      {/* Grand total banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 p-5 ring-1 ring-rose-200/60">
        <div>
          <p className="text-sm font-medium text-gray-500">{budgetLabel}</p>
          <p className="mt-0.5 text-4xl font-bold tabular-nums text-gray-900">
            {formatCurrency(grandTotal)}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-gray-400">{venueLabel}</p>
            <p className="font-semibold tabular-nums text-gray-700">{formatCurrency(venueTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">{otherVendorsLabel}</p>
            <p className="font-semibold tabular-nums text-gray-700">{formatCurrency(nonVenueTotal)}</p>
          </div>
        </div>
      </div>

      {/* Vendor cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] ?? Tag;
          const colorClass = CATEGORY_COLORS[item.category] ?? 'bg-gray-50 text-gray-500';
          const isOver = item.actual > 0 && item.actual > item.estimated;
          const isEditing = editingId === item.id;

          return (
            <Card
              key={item.id}
              className={`relative transition-shadow hover:shadow-md ${isOver ? 'ring-1 ring-red-200' : ''}`}
            >
              <CardContent className="p-4">
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{item.category}</p>
                    {item.vendor && (
                      <p className="truncate text-xs text-gray-400">{item.vendor}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-gray-300 hover:text-red-500"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Estimated cost */}
                <div className="mt-3">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(item.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => saveEdit(item.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={cancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="group flex cursor-pointer items-baseline gap-2"
                      onClick={() => startEdit(item)}
                      title="Click to edit"
                    >
                      <span className="text-2xl font-bold tabular-nums text-gray-900">
                        {formatCurrency(item.estimated)}
                      </span>
                      <Pencil className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                      {savingId === item.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                      )}
                    </button>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">{estimatedLabel}</p>
                </div>

                {/* Actual vs estimated indicator */}
                {item.actual > 0 && (
                  <div className={`mt-2 text-xs font-medium ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isOver
                      ? `▲ Over by ${formatCurrency(item.actual - item.estimated)}`
                      : `✓ Actual: ${formatCurrency(item.actual)}`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Inline add form card */}
        {showAddForm ? (
          <Card className="border-2 border-dashed border-rose-200 bg-rose-50/20">
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder={vendorNamePlaceholder}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Escape') { setShowAddForm(false); setNewCategory(''); setNewEstimated(''); } }}
              />
              <Input
                type="number"
                min="0"
                placeholder={estimatedPlaceholder}
                value={newEstimated}
                onChange={(e) => setNewEstimated(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              {availablePresets.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {availablePresets.slice(0, 8).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-rose-100 hover:text-rose-700 hover:ring-rose-200"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-rose-500 hover:bg-rose-600"
                  onClick={handleAdd}
                  disabled={addingLoading || !newCategory.trim()}
                >
                  {addingLoading
                    ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
                    : <Plus className="me-1.5 h-3.5 w-3.5" />}
                  {addVendorLabel}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowAddForm(false); setNewCategory(''); setNewEstimated(''); }}
                >
                  {cancelLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex min-h-[140px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm text-gray-400 transition-colors hover:border-rose-300 hover:bg-rose-50/30 hover:text-rose-500"
          >
            <Plus className="h-4 w-4" />
            {addVendorLabel}
          </button>
        )}
      </div>
    </div>
  );
}
