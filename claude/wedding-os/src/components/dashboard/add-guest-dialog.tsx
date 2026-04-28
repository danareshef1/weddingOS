'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ChevronDown, Loader2 } from 'lucide-react';
import { createGuest } from '@/actions/guests';
import { guestSchema } from '@/lib/validations';
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  group: '',
  rsvpStatus: 'PENDING' as const,
  mealChoice: '',
  plusOneName: '',
  plusOneMeal: '',
  allergies: '',
};

export function AddGuestDialog() {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function resetForm() {
    setForm(initialForm);
    setShowPlusOne(false);
    setError(null);
    setFieldErrors({});
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      group: form.group || undefined,
      rsvpStatus: form.rsvpStatus,
      mealChoice: form.mealChoice || undefined,
      plusOneName: form.plusOneName || undefined,
      plusOneMeal: form.plusOneMeal || undefined,
      allergies: form.allergies || undefined,
    };

    const result = guestSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await createGuest(result.data);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 800);
    } catch {
      setError(t('addGuestError'));
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
          <UserPlus className="me-2 h-4 w-4" />
          {t('addGuest')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('addGuest')}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Info */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">
              {t('basicInfo')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t('firstName')} *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className={fieldErrors.firstName ? 'border-destructive' : ''}
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t('lastName')} *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className={fieldErrors.lastName ? 'border-destructive' : ''}
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">
              {t('contactInfo')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className={fieldErrors.email ? 'border-destructive' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Event Details */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">
              {t('eventDetails')}
            </legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t('group')}</Label>
                <Select
                  value={form.group}
                  onValueChange={(v) => update('group', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Groom's friends">{t('groomFriends')}</SelectItem>
                    <SelectItem value="Bride's friends">{t('brideFriends')}</SelectItem>
                    <SelectItem value="Groom's family">{t('groomFamily')}</SelectItem>
                    <SelectItem value="Bride's family">{t('brideFamily')}</SelectItem>
                    <SelectItem value="Groom's parents' friends">{t('groomParentsFriends')}</SelectItem>
                    <SelectItem value="Bride's parents' friends">{t('brideParentsFriends')}</SelectItem>
                    <SelectItem value="Groom's parents' work">{t('groomParentsWork')}</SelectItem>
                    <SelectItem value="Bride's parents' work">{t('brideParentsWork')}</SelectItem>
                    <SelectItem value="Groom's work">{t('groomWork')}</SelectItem>
                    <SelectItem value="Bride's work">{t('brideWork')}</SelectItem>
                    <SelectItem value="Other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('rsvpStatus')}</Label>
                <Select
                  value={form.rsvpStatus}
                  onValueChange={(v) => update('rsvpStatus', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t('pending')}</SelectItem>
                    <SelectItem value="ACCEPTED">{t('accepted')}</SelectItem>
                    <SelectItem value="DECLINED">{t('declined')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mealChoice">{t('mealChoice')}</Label>
                <Input
                  id="mealChoice"
                  value={form.mealChoice}
                  onChange={(e) => update('mealChoice', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Plus One — collapsible */}
          <fieldset className="space-y-3">
            <button
              type="button"
              onClick={() => setShowPlusOne(!showPlusOne)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <motion.span
                animate={{ rotate: showPlusOne ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
              {t('plusOne')}
            </button>
            <AnimatePresence>
              {showPlusOne && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="plusOneName">{t('plusOneName')}</Label>
                      <Input
                        id="plusOneName"
                        value={form.plusOneName}
                        onChange={(e) => update('plusOneName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="plusOneMeal">{t('plusOneMeal')}</Label>
                      <Input
                        id="plusOneMeal"
                        value={form.plusOneMeal}
                        onChange={(e) => update('plusOneMeal', e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </fieldset>

          {/* Notes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">
              {t('notes')}
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="allergies">{t('allergies')}</Label>
              <textarea
                id="allergies"
                value={form.allergies}
                onChange={(e) => update('allergies', e.target.value)}
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
          </fieldset>

          {/* Error / Success messages */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600"
            >
              {t('guestAdded')}
            </motion.p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('addGuest')}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
