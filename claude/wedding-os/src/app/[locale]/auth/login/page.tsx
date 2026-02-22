'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function LoginPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

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
      router.push(`/${locale}/dashboard`);
    }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await signIn('email', {
      email: formData.get('magicEmail'),
      redirect: false,
    });
    setMagicLinkSent(true);
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
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
                {t('signIn')}
              </Button>
            </form>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">{t('or')}</span>
              <Separator className="flex-1" />
            </div>

            {magicLinkSent ? (
              <p className="text-center text-sm text-green-600">{t('checkEmail')}</p>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <Label htmlFor="magicEmail">{t('email')}</Label>
                  <Input id="magicEmail" name="magicEmail" type="email" required className="mt-1" />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={loading}>
                  {t('magicLink')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
