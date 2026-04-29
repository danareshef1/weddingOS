'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { deleteBudgetItem, updateBudgetItem } from '@/actions/budget';
import type { BudgetItemInput } from '@/lib/validations';
import type { BudgetItem } from '@prisma/client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'CREDIT', 'CHECKS', 'INSTALLMENTS'] as const;

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: 'bankTransfer',
  CASH: 'cash',
  CREDIT: 'credit',
  CHECKS: 'checks',
  INSTALLMENTS: 'installments',
};

type EditForm = {
  category: string;
  vendor: string;
  description: string;
  estimated: string;
  actual: string;
  deposit: string;
  paid: string;
  paymentMethod: string;
  dueDate: string;
  notes: string;
};

function itemToForm(item: BudgetItem): EditForm {
  return {
    category: item.category,
    vendor: item.vendor ?? '',
    description: item.description ?? '',
    estimated: item.estimated.toString(),
    actual: item.actual.toString(),
    deposit: item.deposit.toString(),
    paid: item.paid.toString(),
    paymentMethod: item.paymentMethod ?? '',
    dueDate: toDateInputValue(item.dueDate),
    notes: item.notes ?? '',
  };
}

function EditBudgetItemDialog({
  item,
  open,
  onClose,
}: {
  item: BudgetItem;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('dashboard');
  const [form, setForm] = useState<EditForm>(() => itemToForm(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof EditForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const actual = parseFloat(form.actual) || 0;
  const paid = parseFloat(form.paid) || 0;
  const remaining = Math.max(0, actual - paid);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateBudgetItem(item.id, {
        category: form.category.trim(),
        vendor: form.vendor.trim() || undefined,
        description: form.description.trim() || undefined,
        estimated: parseFloat(form.estimated) || 0,
        actual: parseFloat(form.actual) || 0,
        deposit: parseFloat(form.deposit) || 0,
        paid: parseFloat(form.paid) || 0,
        paymentMethod: (form.paymentMethod as BudgetItemInput['paymentMethod']) || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError(t('addBudgetError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('editBudgetItem')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">{t('category')} *</Label>
              <Input
                id="edit-category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-vendor">{t('vendor')}</Label>
              <Input
                id="edit-vendor"
                value={form.vendor}
                onChange={(e) => update('vendor', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">{t('description')}</Label>
            <Input
              id="edit-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-estimated">{t('estimated')} (₪)</Label>
              <Input
                id="edit-estimated"
                type="number"
                min="0"
                value={form.estimated}
                onChange={(e) => update('estimated', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-actual">{t('actual')} (₪)</Label>
              <Input
                id="edit-actual"
                type="number"
                min="0"
                value={form.actual}
                onChange={(e) => update('actual', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-deposit">{t('deposit')} (₪)</Label>
              <Input
                id="edit-deposit"
                type="number"
                min="0"
                value={form.deposit}
                onChange={(e) => update('deposit', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-paid">{t('paid')} (₪)</Label>
              <Input
                id="edit-paid"
                type="number"
                min="0"
                value={form.paid}
                onChange={(e) => update('paid', e.target.value)}
              />
            </div>
          </div>

          {actual > 0 && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {t('remaining')}:{' '}
              <span className={`font-semibold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(remaining)}
              </span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('paymentMethod')}</Label>
              <Select
                value={form.paymentMethod || '_none'}
                onValueChange={(v) => update('paymentMethod', v === '_none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{t(paymentMethodLabels[m])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dueDate">{t('dueDate')}</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">{t('notes')}</Label>
            <Textarea
              id="edit-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BudgetTable({ items }: { items: BudgetItem[] }) {
  const t = useTranslations('dashboard');
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80">
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('category')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('vendor')}</th>
              <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('estimated')}</th>
              <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('actual')}</th>
              <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('deposit')}</th>
              <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('paid')}</th>
              <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('remaining')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('paymentMethod')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('status')}</th>
              <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const remaining = Math.max(0, item.actual - item.paid);
              const paymentMethod = item.paymentMethod;
              return (
                <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 font-medium text-gray-900">{item.category}</td>
                  <td className="px-4 py-3.5 text-gray-500">{item.vendor || '-'}</td>
                  <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.estimated)}</td>
                  <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.actual)}</td>
                  <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.deposit)}</td>
                  <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.paid)}</td>
                  <td className="px-4 py-3.5 text-end tabular-nums">
                    {item.actual > 0 ? (
                      <span className={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {formatCurrency(remaining)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {paymentMethod ? t(paymentMethodLabels[paymentMethod] || paymentMethod) : '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    {item.paid >= item.actual && item.actual > 0 ? (
                      <Badge variant="success">{t('paid')}</Badge>
                    ) : item.paid > 0 ? (
                      <Badge variant="warning">{t('partial')}</Badge>
                    ) : (
                      <Badge variant="outline">{t('unpaid')}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-700"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-destructive"
                        onClick={() => deleteBudgetItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-gray-50/80 font-semibold text-gray-900">
              <td className="px-4 py-3" colSpan={2}>{t('total')}</td>
              <td className="px-4 py-3 text-end tabular-nums">
                {formatCurrency(items.reduce((s, i) => s + i.estimated, 0))}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                {formatCurrency(items.reduce((s, i) => s + i.actual, 0))}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                {formatCurrency(items.reduce((s, i) => s + i.deposit, 0))}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                {formatCurrency(items.reduce((s, i) => s + i.paid, 0))}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                {formatCurrency(items.reduce((s, i) => s + Math.max(0, i.actual - i.paid), 0))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {editingItem && (
        <EditBudgetItemDialog
          item={editingItem}
          open={true}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
}
