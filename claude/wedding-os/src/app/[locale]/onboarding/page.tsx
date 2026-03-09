'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';

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
        await update({
          weddingId: result.weddingId,
          onboardingComplete: true,
        });
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-rose-50/30 to-stone-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
            <Heart className="h-6 w-6 text-rose-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>

        <Card className="border-gray-200/60 shadow-lg shadow-gray-200/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="brideName" className="text-gray-700">{t('brideName')}</Label>
                  <Input
                    id="brideName"
                    name="brideName"
                    required
                    placeholder={t('brideNamePlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="groomName" className="text-gray-700">{t('groomName')}</Label>
                  <Input
                    id="groomName"
                    name="groomName"
                    required
                    placeholder={t('groomNamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue" className="text-gray-700">{t('venue')}</Label>
                <Input
                  id="venue"
                  name="venue"
                  required
                  placeholder={t('venuePlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weddingDate" className="text-gray-700">{t('weddingDate')}</Label>
                <Input
                  id="weddingDate"
                  name="weddingDate"
                  type="date"
                  required
                />
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

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {loading ? '...' : t('letsGo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
