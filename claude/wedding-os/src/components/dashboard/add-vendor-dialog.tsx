'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Store } from 'lucide-react';
import { createVendor } from '@/actions/vendors';
import { vendorSchema } from '@/lib/validations';
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
  name: '',
  category: '',
  phone: '',
  email: '',
  notes: '',
  status: 'NOT_STARTED' as const,
  amountPaid: '',
  remainingBalance: '',
  paymentDate: '',
};

export function AddVendorDialog() {
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
      name: form.name,
      category: form.category,
      phone: form.phone || undefined,
      email: form.email || undefined,
      notes: form.notes || undefined,
      status: form.status,
      amountPaid: parseFloat(form.amountPaid) || 0,
      remainingBalance: parseFloat(form.remainingBalance) || 0,
      paymentDate: form.paymentDate || undefined,
    };

    const result = vendorSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0]?.message || t('addVendorError'));
      return;
    }

    setLoading(true);
    try {
      await createVendor(result.data);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 800);
    } catch {
      setError(t('addVendorError'));
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
        <Button size="sm" className="gap-1.5">
          <Store className="h-4 w-4" />
          {t('addVendor')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {t('addVendor')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">{t('vendorName')} *</Label>
              <Input
                id="vendor-name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-category">{t('vendorCategory')} *</Label>
              <Input
                id="vendor-category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-phone">{t('phone')}</Label>
              <Input
                id="vendor-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-email">{t('email')}</Label>
              <Input
                id="vendor-email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('vendorStatus')}</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">{t('notStarted')}</SelectItem>
                <SelectItem value="CONTACTED">{t('contacted')}</SelectItem>
                <SelectItem value="BOOKED">{t('booked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-amountPaid">{t('amountPaid')}</Label>
              <Input
                id="vendor-amountPaid"
                type="number"
                min="0"
                value={form.amountPaid}
                onChange={(e) => update('amountPaid', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-remainingBalance">{t('remainingBalance')}</Label>
              <Input
                id="vendor-remainingBalance"
                type="number"
                min="0"
                value={form.remainingBalance}
                onChange={(e) => update('remainingBalance', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-paymentDate">{t('paymentDate')}</Label>
              <Input
                id="vendor-paymentDate"
                type="date"
                value={form.paymentDate}
                onChange={(e) => update('paymentDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor-notes">{t('notes')}</Label>
            <textarea
              id="vendor-notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{t('vendorAdded')}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('addVendor')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
