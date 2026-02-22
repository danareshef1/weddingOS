'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submitRsvp } from '@/actions/rsvp';

type Step = 'code' | 'details' | 'success';

export function RsvpForm() {
  const t = useTranslations('rsvp');
  const [step, setStep] = useState<Step>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inviteCode.trim()) {
      setStep('details');
      setError('');
    }
  }

  async function handleRsvpSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    formData.set('inviteCode', inviteCode);

    try {
      const result = await submitRsvp(formData);
      if (result.success) {
        setStep('success');
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
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="text-center font-serif text-2xl">{t('title')}</CardTitle>
        <p className="text-center text-sm text-muted-foreground">{t('subtitle')}</p>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {step === 'code' && (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCodeSubmit}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="inviteCode">{t('inviteCode')}</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder={t('enterCode')}
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                {t('continue')}
              </Button>
            </motion.form>
          )}

          {step === 'details' && (
            <motion.form
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              action={handleRsvpSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('firstName')}</Label>
                  <Input id="firstName" name="firstName" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName')}</Label>
                  <Input id="lastName" name="lastName" required className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" name="email" type="email" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input id="phone" name="phone" type="tel" className="mt-1" />
              </div>

              <div>
                <Label>{t('willYouAttend')}</Label>
                <Select name="rsvpStatus" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCEPTED">{t('yes')}</SelectItem>
                    <SelectItem value="DECLINED">{t('no')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('mealChoice')}</Label>
                <Select name="mealChoice">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chicken">{t('chicken')}</SelectItem>
                    <SelectItem value="Fish">{t('fish')}</SelectItem>
                    <SelectItem value="Vegetarian">{t('vegetarian')}</SelectItem>
                    <SelectItem value="Vegan">{t('vegan')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="allergies">{t('allergies')}</Label>
                <Input id="allergies" name="allergies" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="plusOneName">{t('plusOne')}</Label>
                <Input id="plusOneName" name="plusOneName" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="songRequest">{t('songRequest')}</Label>
                <Textarea
                  id="songRequest"
                  name="songRequest"
                  placeholder={t('songPlaceholder')}
                  className="mt-1"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('code')}
                  className="flex-1"
                >
                  {t('inviteCode')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '...' : t('submit')}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium">{t('success')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
