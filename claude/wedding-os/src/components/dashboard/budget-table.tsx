'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { deleteBudgetItem } from '@/actions/budget';
import type { BudgetItem } from '@prisma/client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: 'bankTransfer',
  CASH: 'cash',
  CREDIT: 'credit',
  CHECKS: 'checks',
  INSTALLMENTS: 'installments',
};

export function BudgetTable({ items }: { items: BudgetItem[] }) {
  const t = useTranslations('dashboard');

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/80">
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">Vendor</th>
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
            <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">Estimated</th>
            <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">Actual</th>
            <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('deposit')}</th>
            <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">Paid</th>
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('paymentMethod')}</th>
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const deposit = item.deposit;
            const paymentMethod = item.paymentMethod;
            return (
              <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3.5 font-medium text-gray-900">{item.category}</td>
                <td className="px-4 py-3.5 text-gray-500">{item.vendor || '-'}</td>
                <td className="px-4 py-3.5 text-gray-500">{item.description || '-'}</td>
                <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.estimated)}</td>
                <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.actual)}</td>
                <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(deposit)}</td>
                <td className="px-4 py-3.5 text-end tabular-nums">{formatCurrency(item.paid)}</td>
                <td className="px-4 py-3.5 text-gray-500">
                  {paymentMethod ? t(paymentMethodLabels[paymentMethod] || paymentMethod) : '-'}
                </td>
                <td className="px-4 py-3.5">
                  {item.paid >= item.actual && item.actual > 0 ? (
                    <Badge variant="success">Paid</Badge>
                  ) : item.paid > 0 ? (
                    <Badge variant="warning">Partial</Badge>
                  ) : (
                    <Badge variant="outline">Unpaid</Badge>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-destructive"
                    onClick={() => deleteBudgetItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-gray-50/80 font-semibold text-gray-900">
            <td className="px-4 py-3" colSpan={3}>Total</td>
            <td className="px-4 py-3 text-end tabular-nums">
              {formatCurrency(items.reduce((s, i) => s + i.estimated, 0))}
            </td>
            <td className="px-4 py-3 text-end tabular-nums">
              {formatCurrency(items.reduce((s, i) => s + i.actual, 0))}
            </td>
            <td className="px-4 py-3 text-end tabular-nums">
              {formatCurrency(items.reduce((s, i) => s + i.deposit, 0))}
            </td>
            <td className="px-4 py-3 text-end tabular-nums">
              {formatCurrency(items.reduce((s, i) => s + i.paid, 0))}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
