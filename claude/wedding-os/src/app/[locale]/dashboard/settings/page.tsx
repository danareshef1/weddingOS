'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  updateAccountInfo,
  updatePassword,
  updateWeddingDetails,
  updateLanguagePreference,
} from '@/actions/settings';
import {
  Loader2,
  User,
  Heart,
  Lock,
  Shield,
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
} from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────── */

type SectionStatus = { loading: boolean; success: boolean; error: string | null };
const idle: SectionStatus = { loading: false, success: false, error: null };

function useSection() {
  const [status, setStatus] = useState<SectionStatus>(idle);
  async function run(fn: () => Promise<{ success?: boolean; error?: string }>) {
    setStatus({ loading: true, success: false, error: null });
    try {
      const res = await fn();
      if (res.error) {
        setStatus({ loading: false, success: false, error: res.error });
      } else {
        setStatus({ loading: false, success: true, error: null });
        setTimeout(() => setStatus(idle), 3000);
      }
    } catch {
      setStatus({ loading: false, success: false, error: 'unknown' });
    }
  }
  return { status, run };
}

function Feedback({ status, t }: { status: SectionStatus; t: ReturnType<typeof useTranslations> }) {
  if (status.success)
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        {t('settingsSaved')}
      </span>
    );
  if (status.error) {
    const key = `settingsError_${status.error}` as any;
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
        <AlertCircle className="h-4 w-4" />
        {t.has(key) ? t(key) : t('settingsErrorUnknown')}
      </span>
    );
  }
  return null;
}

/* ─── field ────────────────────────────────────────────────── */
function Field({
  id,
  label,
  type = 'text',
  name,
  defaultValue,
  required,
  minLength,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}

/* ─── section card ──────────────────────────────────────────── */
function Section({
  icon: Icon,
  title,
  children,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className={`flex items-center gap-3 border-b border-gray-100 px-6 py-4 ${accent ?? 'bg-gray-50/60'}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
          <Icon className="h-4 w-4 text-rose-500" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ─── save button ───────────────────────────────────────────── */
function SaveButton({ loading }: { loading: boolean }) {
  const t = useTranslations('dashboard');
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {t('settingsSave')}
    </button>
  );
}

/* ─── page ──────────────────────────────────────────────────── */
export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const router = useRouter();

  const [initData, setInitData] = useState<{
    user: { name: string | null; email: string };
    wedding: {
      partner1Name: string;
      partner2Name: string;
      date: string | null;
      venue: string | null;
      locale: string;
    };
  } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInitData(d));
  }, []);

  const account = useSection();
  const password = useSection();
  const wedding = useSection();
  const language = useSection();

  if (!initData) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
      </div>
    );
  }

  const weddingDate = initData.wedding.date
    ? new Date(initData.wedding.date).toISOString().slice(0, 10)
    : '';

  async function handleAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await account.run(() =>
      updateAccountInfo({ name: fd.get('name') as string, email: fd.get('email') as string })
    );
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPw = fd.get('newPassword') as string;
    if (newPw !== fd.get('confirmPassword')) {
      await password.run(() => Promise.resolve({ error: 'passwordMismatch' }));
      return;
    }
    await password.run(() =>
      updatePassword({ currentPassword: fd.get('currentPassword') as string, newPassword: newPw })
    );
    if (!password.status.error) (e.target as HTMLFormElement).reset();
  }

  async function handleWedding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await wedding.run(() =>
      updateWeddingDetails({
        partner1Name: fd.get('partner1Name') as string,
        partner2Name: fd.get('partner2Name') as string,
        date: fd.get('date') as string,
        venue: fd.get('venue') as string,
      })
    );
  }

  async function handleLanguage(newLocale: string) {
    await language.run(() => updateLanguagePreference(newLocale));
    router.push(`/${newLocale}/dashboard/settings`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('settingsSubtitle')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left column — main forms */}
        <div className="space-y-5 lg:col-span-3">

          {/* Account */}
          <Section icon={User} title={t('settingsAccount')}>
            <form onSubmit={handleAccount} className="space-y-4">
              <Field id="name" name="name" label={t('settingsName')} defaultValue={initData.user.name ?? ''} placeholder="Dana Cohen" />
              <Field id="email" name="email" label={t('settingsEmail')} type="email" defaultValue={initData.user.email} required placeholder="dana@example.com" />
              <div className="flex items-center gap-4 pt-1">
                <SaveButton loading={account.status.loading} />
                <Feedback status={account.status} t={t} />
              </div>
            </form>
          </Section>

          {/* Wedding Details */}
          <Section icon={Heart} title={t('weddingDetails')} accent="bg-rose-50/40">
            <form onSubmit={handleWedding} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field id="partner1Name" name="partner1Name" label={t('partner1Name')} defaultValue={initData.wedding.partner1Name} required />
                <Field id="partner2Name" name="partner2Name" label={t('partner2Name')} defaultValue={initData.wedding.partner2Name} required />
              </div>
              <Field id="date" name="date" label={t('weddingDate')} type="date" defaultValue={weddingDate} />
              <Field id="venue" name="venue" label={t('venue')} defaultValue={initData.wedding.venue ?? ''} placeholder={t('venuePlaceholder')} />
              <div className="flex items-center gap-4 pt-1">
                <SaveButton loading={wedding.status.loading} />
                <Feedback status={wedding.status} t={t} />
              </div>
            </form>
          </Section>

          {/* Password */}
          <Section icon={Lock} title={t('settingsChangePassword')}>
            <form onSubmit={handlePassword} className="space-y-4">
              <Field id="currentPassword" name="currentPassword" label={t('settingsCurrentPassword')} type="password" required placeholder="••••••••" />
              <div className="grid grid-cols-2 gap-4">
                <Field id="newPassword" name="newPassword" label={t('settingsNewPassword')} type="password" minLength={8} required placeholder="••••••••" />
                <Field id="confirmPassword" name="confirmPassword" label={t('settingsConfirmPassword')} type="password" minLength={8} required placeholder="••••••••" />
              </div>
              <div className="flex items-center gap-4 pt-1">
                <SaveButton loading={password.status.loading} />
                <Feedback status={password.status} t={t} />
              </div>
            </form>
          </Section>
        </div>

        {/* Right column — preferences + security */}
        <div className="space-y-5 lg:col-span-2">

          {/* Language */}
          <Section icon={Globe} title={t('settingsPreferences')}>
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{t('defaultLanguage')}</p>
              <div className="flex flex-col gap-2">
                {(['he', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleLanguage(l)}
                    disabled={language.status.loading}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                      locale === l
                        ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <span>{l === 'he' ? '🇮🇱  עברית' : '🇺🇸  English'}</span>
                    {locale === l && <CheckCircle2 className="h-4 w-4 text-rose-500" />}
                    {locale !== l && <ChevronRight className="h-4 w-4 text-gray-300" />}
                  </button>
                ))}
              </div>
              {language.status.success && (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('settingsSaved')}
                </p>
              )}
            </div>
          </Section>

          {/* Security */}
          <Section icon={Shield} title={t('settingsSecurity')}>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">{t('settingsLogoutDesc')}</p>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>
            </div>
          </Section>

          {/* Account info card */}
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-semibold text-sm">
                {(initData.user.name ?? initData.user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {initData.user.name || '—'}
                </p>
                <p className="truncate text-xs text-gray-500">{initData.user.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>{initData.wedding.partner1Name} & {initData.wedding.partner2Name}</span>
              </div>
              {initData.wedding.date && (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">📅</span>
                  <span>{new Date(initData.wedding.date).toLocaleDateString()}</span>
                </div>
              )}
              {initData.wedding.venue && (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400">📍</span>
                  <span className="truncate">{initData.wedding.venue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
