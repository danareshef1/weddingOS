'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Wallet } from 'lucide-react';
import { createBudgetItem } from '@/actions/budget';
import { budgetItemSchema } from '@/lib/validations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialForm = {
  category: '',
  vendor: '',
  description: '',
  estimated: '',
  actual: '',
  paid: '',
  deposit: '',
  paymentMethod: '',
  dueDate: '',
};

export function AddBudgetDialog() {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      category: form.category,
      vendor: form.vendor || undefined,
      description: form.description || undefined,
      estimated: parseFloat(form.estimated) || 0,
      actual: parseFloat(form.actual) || 0,
      paid: parseFloat(form.paid) || 0,
      deposit: parseFloat(form.deposit) || 0,
      paymentMethod: form.paymentMethod || undefined,
      dueDate: form.dueDate || undefined,
    };

    const result = budgetItemSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0]?.message || t('addBudgetError'));
      return;
    }

    setLoading(true);
    try {
      await createBudgetItem(result.data);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 800);
    } catch {
      setError(t('addBudgetError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Wallet className="me-2 h-4 w-4" />
          {t('addBudgetItem')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {t('addBudgetItem')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="budget-category">Category *</Label>
              <Input
                id="budget-category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-vendor">Vendor</Label>
              <Input
                id="budget-vendor"
                value={form.vendor}
                onChange={(e) => update('vendor', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-description">Description</Label>
            <Input
              id="budget-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="budget-estimated">Estimated *</Label>
              <Input
                id="budget-estimated"
                type="number"
                min="0"
                value={form.estimated}
                onChange={(e) => update('estimated', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-actual">Actual</Label>
              <Input
                id="budget-actual"
                type="number"
                min="0"
                value={form.actual}
                onChange={(e) => update('actual', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="budget-deposit">{t('deposit')}</Label>
              <Input
                id="budget-deposit"
                type="number"
                min="0"
                value={form.deposit}
                onChange={(e) => update('deposit', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-paid">Paid</Label>
              <Input
                id="budget-paid"
                type="number"
                min="0"
                value={form.paid}
                onChange={(e) => update('paid', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('paymentMethod')}</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => update('paymentMethod', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">{t('bankTransfer')}</SelectItem>
                  <SelectItem value="CASH">{t('cash')}</SelectItem>
                  <SelectItem value="CREDIT">{t('credit')}</SelectItem>
                  <SelectItem value="CHECKS">{t('checks')}</SelectItem>
                  <SelectItem value="INSTALLMENTS">{t('installments')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-dueDate">Due Date</Label>
            <Input
              id="budget-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{t('budgetItemAdded')}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('addBudgetItem')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
