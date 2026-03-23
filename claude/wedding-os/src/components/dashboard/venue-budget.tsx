'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, Plus, Trash2 } from 'lucide-react';
import { updateVenueBudget } from '@/actions/wedding';
import { createBudgetItem, deleteBudgetItem } from '@/actions/budget';

interface VenueItem {
  id: string;
  description: string | null;
  actual: number;
}

interface VenueBudgetProps {
  venuePricePerPerson: number;
  venueMinGuests: number;
  venueReservePrice: number;
  venueExtraHourPrice: number;
  venueExtraPersons: number;
  venueExtraHours: number;
  venueItems: VenueItem[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function VenueBudget(props: VenueBudgetProps) {
  const t = useTranslations('dashboard');
  const [pricePerPerson, setPricePerPerson] = useState(props.venuePricePerPerson.toString());
  const [minGuests, setMinGuests] = useState(props.venueMinGuests.toString());
  const [reservePrice, setReservePrice] = useState(props.venueReservePrice.toString());
  const [extraHourPrice, setExtraHourPrice] = useState(props.venueExtraHourPrice.toString());
  const [extraPersons, setExtraPersons] = useState(props.venueExtraPersons.toString());
  const [extraHours, setExtraHours] = useState(props.venueExtraHours.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const baseCost = (parseFloat(pricePerPerson) || 0) * (parseInt(minGuests) || 0);
  const extraPersonsCost = (parseFloat(reservePrice) || 0) * (parseInt(extraPersons) || 0);
  const extraHoursCost = (parseFloat(extraHourPrice) || 0) * (parseInt(extraHours) || 0);
  const itemsCost = props.venueItems.reduce((sum, item) => sum + item.actual, 0);
  const venueTotal = baseCost + extraPersonsCost + extraHoursCost + itemsCost;

  async function handleSave() {
    setSaving(true);
    try {
      await updateVenueBudget({
        venuePricePerPerson: parseFloat(pricePerPerson) || 0,
        venueMinGuests: parseInt(minGuests) || 0,
        venueReservePrice: parseFloat(reservePrice) || 0,
        venueExtraHourPrice: parseFloat(extraHourPrice) || 0,
        venueExtraPersons: parseInt(extraPersons) || 0,
        venueExtraHours: parseInt(extraHours) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save venue budget:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem() {
    if (!newItemName.trim() || !newItemCost) return;
    setAddingItem(true);
    try {
      await createBudgetItem({
        category: 'Venue',
        description: newItemName.trim(),
        estimated: parseFloat(newItemCost) || 0,
        actual: parseFloat(newItemCost) || 0,
      });
      setNewItemName('');
      setNewItemCost('');
    } catch (error) {
      console.error('Failed to add venue item:', error);
    } finally {
      setAddingItem(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Building2 className="h-5 w-5 text-primary" />
          {t('venueBudget')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="venue-pperson">{t('pricePerPerson')}</Label>
            <Input
              id="venue-pperson"
              type="number"
              min="0"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venue-min-guests">{t('committedGuests')}</Label>
            <Input
              id="venue-min-guests"
              type="number"
              min="0"
              value={minGuests}
              onChange={(e) => setMinGuests(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venue-reserve">{t('reservePersonPrice')}</Label>
            <div className="flex gap-2">
              <Input
                id="venue-reserve"
                type="number"
                min="0"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">×</span>
                <Input
                  type="number"
                  min="0"
                  value={extraPersons}
                  onChange={(e) => setExtraPersons(e.target.value)}
                  className="w-20"
                  placeholder="0"
                />
              </div>
            </div>
            {(parseInt(extraPersons) || 0) > 0 && (
              <p className="text-xs text-gray-400">
                {t('extraPersonsCost')}: {formatCurrency(extraPersonsCost)}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venue-extra-hour">{t('extraHourPrice')}</Label>
            <div className="flex gap-2">
              <Input
                id="venue-extra-hour"
                type="number"
                min="0"
                value={extraHourPrice}
                onChange={(e) => setExtraHourPrice(e.target.value)}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">×</span>
                <Input
                  type="number"
                  min="0"
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  className="w-20"
                  placeholder="0"
                />
              </div>
            </div>
            {(parseInt(extraHours) || 0) > 0 && (
              <p className="text-xs text-gray-400">
                {t('extraHoursCost')}: {formatCurrency(extraHoursCost)}
              </p>
            )}
          </div>
        </div>

        {/* Venue additional items */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{t('venueItems')}</p>

          {props.venueItems.length > 0 && (
            <div className="space-y-1.5">
              {props.venueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{item.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-gray-900">{formatCurrency(item.actual)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-destructive"
                      onClick={() => deleteBudgetItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder={t('venueItemName')}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              placeholder={t('venueItemCost')}
              value={newItemCost}
              onChange={(e) => setNewItemCost(e.target.value)}
              className="w-32"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              disabled={addingItem || !newItemName.trim() || !newItemCost}
            >
              {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-50 p-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('venueTotal')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(venueTotal)}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
              <span>{t('venueBase', { count: parseInt(minGuests) || 0 })}: {formatCurrency(baseCost)}</span>
              {(parseInt(extraPersons) || 0) > 0 && (
                <span>+ {parseInt(extraPersons)} {t('extraPersons')}: {formatCurrency(extraPersonsCost)}</span>
              )}
              {(parseInt(extraHours) || 0) > 0 && (
                <span>+ {parseInt(extraHours)} {t('extraHours')}: {formatCurrency(extraHoursCost)}</span>
              )}
              {itemsCost > 0 && (
                <span>+ {t('venueItems')}: {formatCurrency(itemsCost)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
