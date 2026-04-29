'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { UserPlus, Users, User, Loader2, Minus, Plus, BookUser, Upload } from 'lucide-react';
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
import { cn } from '@/lib/utils';

// Contact Picker API types (not in standard TS lib yet)
type ContactProperty = 'name' | 'tel' | 'email';
interface ContactsManager {
  select(props: ContactProperty[], opts?: { multiple?: boolean }): Promise<Array<{ name?: string[]; tel?: string[] }>>;
}
declare global {
  interface Navigator { contacts?: ContactsManager; }
}

function parseContactName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Parse a vCard string (exported from Apple Contacts, Google, etc.)
function parseVCard(vcf: string): { firstName: string; lastName: string; phone: string } {
  const lines = vcf.replace(/\r\n|\r/g, '\n').split('\n');
  let firstName = '';
  let lastName = '';
  let phone = '';

  for (const line of lines) {
    if (line.startsWith('FN:') && !firstName && !lastName) {
      const { firstName: fn, lastName: ln } = parseContactName(line.slice(3).trim());
      firstName = fn;
      lastName = ln;
    } else if (line.startsWith('N:') && (!firstName || !lastName)) {
      // N:LastName;FirstName;Middle;Prefix;Suffix
      const parts = line.slice(2).split(';');
      if (!lastName && parts[0]) lastName = parts[0].trim();
      if (!firstName && parts[1]) firstName = parts[1].trim();
    } else if (line.startsWith('TEL') && !phone) {
      const colon = line.indexOf(':');
      if (colon !== -1) phone = line.slice(colon + 1).trim();
    }
  }

  return { firstName, lastName, phone };
}

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "Groom's friends",          key: 'groomFriends' },
  { value: "Bride's friends",          key: 'brideFriends' },
  { value: "Groom's family",           key: 'groomFamily' },
  { value: "Bride's family",           key: 'brideFamily' },
  { value: "Groom's parents' friends", key: 'groomParentsFriends' },
  { value: "Bride's parents' friends", key: 'brideParentsFriends' },
  { value: "Groom's parents' work",    key: 'groomParentsWork' },
  { value: "Bride's parents' work",    key: 'brideParentsWork' },
  { value: "Groom's work",             key: 'groomWork' },
  { value: "Bride's work",             key: 'brideWork' },
  { value: 'Other',                    key: 'other' },
] as const;

// ─── Guest count stepper ──────────────────────────────────────────────────────

function CountStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-semibold text-gray-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(50, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GuestType = 'INDIVIDUAL' | 'FAMILY';

const initialIndividual = {
  firstName: '',
  lastName: '',
  phone: '',
  guestCount: 1,
  group: '',
};

const initialFamily = {
  familyName: '',
  phone: '',
  guestCount: 2,
  group: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AddGuestDialog() {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const [guestType, setGuestType] = useState<GuestType>('INDIVIDUAL');
  const [individual, setIndividual] = useState(initialIndividual);
  const [family, setFamily] = useState(initialFamily);
  const [loading, setLoading] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);
  const [contactFilled, setContactFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [contactsSupported, setContactsSupported] = useState(false);
  useEffect(() => {
    setContactsSupported(typeof navigator !== 'undefined' && 'contacts' in navigator);
  }, []);

  function applyContact(firstName: string, lastName: string, phone: string) {
    if (guestType === 'INDIVIDUAL') {
      setIndividual((prev) => ({ ...prev, firstName, lastName, phone }));
    } else {
      setFamily((prev) => ({ ...prev, familyName: lastName || firstName, phone }));
    }
    setContactFilled(true);
  }

  async function handlePickContact() {
    if (!navigator.contacts) return;
    setPickingContact(true);
    setContactFilled(false);
    try {
      const results = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (!results.length) return;
      const contact = results[0];
      const fullName = contact.name?.[0] ?? '';
      const phone = contact.tel?.[0] ?? '';
      const { firstName, lastName } = parseContactName(fullName);
      applyContact(firstName, lastName, phone);
    } catch {
      // User cancelled or permission denied — do nothing
    } finally {
      setPickingContact(false);
    }
  }

  function handleVCardFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { firstName, lastName, phone } = parseVCard(text);
      applyContact(firstName, lastName, phone);
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  }

  function updateIndividual(k: keyof typeof initialIndividual, v: string | number) {
    setIndividual((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  }

  function updateFamily(k: keyof typeof initialFamily, v: string | number) {
    setFamily((p) => ({ ...p, [k]: v }));
    setFieldErrors((p) => { const n = { ...p }; delete n[k]; return n; });
  }

  function resetForm() {
    setGuestType('INDIVIDUAL');
    setIndividual(initialIndividual);
    setFamily(initialFamily);
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    setContactFilled(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const data =
      guestType === 'INDIVIDUAL'
        ? {
            guestType: 'INDIVIDUAL' as const,
            firstName: individual.firstName,
            lastName: individual.lastName,
            phone: individual.phone || undefined,
            guestCount: individual.guestCount,
            group: individual.group || undefined,
            rsvpStatus: 'PENDING' as const,
          }
        : {
            guestType: 'FAMILY' as const,
            firstName: '',
            lastName: family.familyName,
            phone: family.phone || undefined,
            guestCount: family.guestCount,
            group: family.group || undefined,
            rsvpStatus: 'PENDING' as const,
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="me-2 h-4 w-4" />
          {t('addGuest')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('addGuest')}
          </DialogTitle>
        </DialogHeader>

        {/* Type switcher */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border bg-gray-50 p-1.5">
          {(['INDIVIDUAL', 'FAMILY'] as const).map((type) => {
            const isActive = guestType === type;
            const Icon = type === 'INDIVIDUAL' ? User : Users;
            const label = type === 'INDIVIDUAL' ? t('individualGuest') : t('familyGroup');
            const desc = type === 'INDIVIDUAL' ? t('individualDesc') : t('familyDesc');
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setGuestType(type); setFieldErrors({}); setError(null); }}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-start transition-all',
                  isActive
                    ? 'bg-white shadow-sm ring-1 ring-gray-200'
                    : 'hover:bg-white/60',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn('h-4 w-4', isActive ? 'text-rose-500' : 'text-gray-400')} />
                  <span className={cn('text-sm font-semibold', isActive ? 'text-gray-900' : 'text-gray-500')}>
                    {label}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 leading-snug">{desc}</span>
              </button>
            );
          })}
        </div>

        {/* Contact import — vCard works on all platforms; native picker on Android */}
        <div className="space-y-2">
          <div className={cn('grid gap-2', contactsSupported ? 'grid-cols-2' : 'grid-cols-1')}>
            {/* vCard file import — macOS, Windows, any browser */}
            <button
              type="button"
              onClick={() => vcfInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:border-rose-300 hover:bg-rose-50/40 hover:text-rose-600"
            >
              <Upload className="h-4 w-4 shrink-0" />
              {t('importVcf')}
            </button>
            <input
              ref={vcfInputRef}
              type="file"
              accept=".vcf,text/vcard"
              className="hidden"
              onChange={handleVCardFile}
            />

            {/* Native contact picker — Android Chrome only */}
            {contactsSupported && (
              <button
                type="button"
                onClick={handlePickContact}
                disabled={pickingContact}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:border-rose-300 hover:bg-rose-50/40 hover:text-rose-600 disabled:opacity-50"
              >
                {pickingContact
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <BookUser className="h-4 w-4 shrink-0" />}
                {t('importFromContacts')}
              </button>
            )}
          </div>

          {contactFilled && (
            <p className="text-center text-xs text-emerald-600">{t('contactsFilled')}</p>
          )}
        </div>

        <motion.form
          key={guestType}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          onSubmit={handleSubmit}
          className="space-y-5 pt-1"
        >
          {guestType === 'INDIVIDUAL' ? (
            <>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">{t('firstName')} *</Label>
                  <Input
                    id="firstName"
                    value={individual.firstName}
                    onChange={(e) => updateIndividual('firstName', e.target.value)}
                    className={fieldErrors.firstName ? 'border-destructive' : ''}
                    autoFocus
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">{t('lastName')} *</Label>
                  <Input
                    id="lastName"
                    value={individual.lastName}
                    onChange={(e) => updateIndividual('lastName', e.target.value)}
                    className={fieldErrors.lastName ? 'border-destructive' : ''}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={individual.phone}
                  onChange={(e) => updateIndividual('phone', e.target.value)}
                />
              </div>

              {/* Guest count + category */}
              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-1.5">
                  <Label>{t('guestCount')}</Label>
                  <CountStepper
                    value={individual.guestCount}
                    onChange={(n) => updateIndividual('guestCount', n)}
                  />
                  <p className="text-[11px] text-gray-400">{t('guestCountHint')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('group')}</Label>
                  <Select value={individual.group} onValueChange={(v) => updateIndividual('group', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectGroup')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{t(c.key as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Family name */}
              <div className="space-y-1.5">
                <Label htmlFor="familyName">{t('familyName')} *</Label>
                <Input
                  id="familyName"
                  value={family.familyName}
                  onChange={(e) => updateFamily('familyName', e.target.value)}
                  placeholder="e.g. The Cohen Family"
                  className={fieldErrors.lastName ? 'border-destructive' : ''}
                  autoFocus
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="familyPhone">{t('phone')}</Label>
                <Input
                  id="familyPhone"
                  type="tel"
                  value={family.phone}
                  onChange={(e) => updateFamily('phone', e.target.value)}
                />
              </div>

              {/* Guest count + category */}
              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-1.5">
                  <Label>{t('guestCount')}</Label>
                  <CountStepper
                    value={family.guestCount}
                    onChange={(n) => updateFamily('guestCount', n)}
                  />
                  <p className="text-[11px] text-gray-400">{t('guestCountHint')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('group')}</Label>
                  <Select value={family.group} onValueChange={(v) => updateFamily('group', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectGroup')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{t(c.key as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600">
              {t('guestAdded')}
            </motion.p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
