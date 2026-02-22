'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center font-serif text-2xl">{t('login')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" name="email" type="email" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" name="password" type="password" required className="mt-1" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : t('signIn')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href={`/${locale}/auth/register`} className="text-primary hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
