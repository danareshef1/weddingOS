'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart } from 'lucide-react';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const params = useParams();
  const locale = params.locale as string;
  const { update } = useSession();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      brideName: formData.get('brideName') as string,
      groomName: formData.get('groomName') as string,
      venue: formData.get('venue') as string,
      weddingDate: formData.get('weddingDate') as string,
    };

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        // Pass fresh data to update() — this rewrites the JWT cookie
        // with onboardingComplete: true via the jwt callback
        await update({
          weddingId: result.weddingId,
          onboardingComplete: true,
        });
        // Full page navigation with fresh JWT cookie
        window.location.href = `/${locale}/dashboard`;
        return;
      } else {
        setError(result.error || t('error'));
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-3xl">{t('title')}</CardTitle>
            <CardDescription className="text-base">{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brideName">{t('brideName')}</Label>
                  <Input
                    id="brideName"
                    name="brideName"
                    required
                    placeholder={t('brideNamePlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="groomName">{t('groomName')}</Label>
                  <Input
                    id="groomName"
                    name="groomName"
                    required
                    placeholder={t('groomNamePlaceholder')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue">{t('venue')}</Label>
                <Input
                  id="venue"
                  name="venue"
                  required
                  placeholder={t('venuePlaceholder')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="weddingDate">{t('weddingDate')}</Label>
                <Input
                  id="weddingDate"
                  name="weddingDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? '...' : t('letsGo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
