'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateWeddingSettings } from '@/actions/wedding';

export default function SettingsPage() {
  const t = useTranslations('dashboard');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateWeddingSettings({
        partner1Name: formData.get('partner1Name') as string,
        partner2Name: formData.get('partner2Name') as string,
        date: formData.get('date') as string,
        venue: formData.get('venue') as string,
        locale: formData.get('locale') as 'he' | 'en',
        theme: formData.get('theme') as string,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Settings error:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold">{t('settings')}</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('weddingDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partner1Name">{t('partner1Name')}</Label>
                <Input id="partner1Name" name="partner1Name" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="partner2Name">{t('partner2Name')}</Label>
                <Input id="partner2Name" name="partner2Name" required className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="date">{t('weddingDate')}</Label>
              <Input id="date" name="date" type="date" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="venue">{t('venue')}</Label>
              <Input id="venue" name="venue" className="mt-1" />
            </div>

            <div>
              <Label>{t('defaultLanguage')}</Label>
              <Select name="locale" defaultValue="he">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('theme')}</Label>
              <Select name="theme" defaultValue="default">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('themeDefault')}</SelectItem>
                  <SelectItem value="elegant">{t('themeElegant')}</SelectItem>
                  <SelectItem value="modern">{t('themeModern')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? t('saving') : t('save')}
              </Button>
              {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
