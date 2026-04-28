'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const locale = params.locale as string;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const justVerified = searchParams.get('verified') === '1';

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError(t('invalidCredentials'));
    } else {
      window.location.href = `/${locale}/`;
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">{t('login')}</h1>
        </div>

        <Card className="border-gray-200/60 shadow-lg shadow-gray-200/50">
          <CardContent className="p-6">
            {justVerified && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700"
              >
                Email verified! You can now sign in.
              </motion.p>
            )}
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700">{t('email')}</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700">{t('password')}</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {loading ? '...' : t('signIn')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/auth/register`} className="font-medium text-rose-600 hover:text-rose-700">
                {t('createAccount')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
