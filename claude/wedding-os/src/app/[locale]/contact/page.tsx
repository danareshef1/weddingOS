'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // In production, send to an API endpoint
    setSubmitted(true);
  }

  return (
    <main className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <p className="text-center text-green-600">{t('success')}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input id="name" name="name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" name="email" type="email" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message">{t('message')}</Label>
                  <Textarea id="message" name="message" required rows={5} className="mt-1" />
                </div>
                <Button type="submit" className="w-full">
                  {t('send')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
    </main>
  );
}
