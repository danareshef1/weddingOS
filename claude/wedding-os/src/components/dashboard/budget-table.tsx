'use client';

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

export function BudgetTable({ items }: { items: BudgetItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-start font-medium">Category</th>
            <th className="px-4 py-3 text-start font-medium">Vendor</th>
            <th className="px-4 py-3 text-start font-medium">Description</th>
            <th className="px-4 py-3 text-end font-medium">Estimated</th>
            <th className="px-4 py-3 text-end font-medium">Actual</th>
            <th className="px-4 py-3 text-end font-medium">Paid</th>
            <th className="px-4 py-3 text-start font-medium">Status</th>
            <th className="px-4 py-3 text-start font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{item.category}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.vendor || '-'}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.description || '-'}</td>
              <td className="px-4 py-3 text-end">{formatCurrency(item.estimated)}</td>
              <td className="px-4 py-3 text-end">{formatCurrency(item.actual)}</td>
              <td className="px-4 py-3 text-end">{formatCurrency(item.paid)}</td>
              <td className="px-4 py-3">
                {item.paid >= item.actual && item.actual > 0 ? (
                  <Badge variant="success">Paid</Badge>
                ) : item.paid > 0 ? (
                  <Badge variant="warning">Partial</Badge>
                ) : (
                  <Badge variant="outline">Unpaid</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteBudgetItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/50 font-semibold">
            <td className="px-4 py-3" colSpan={3}>Total</td>
            <td className="px-4 py-3 text-end">
              {formatCurrency(items.reduce((s, i) => s + i.estimated, 0))}
            </td>
            <td className="px-4 py-3 text-end">
              {formatCurrency(items.reduce((s, i) => s + i.actual, 0))}
            </td>
            <td className="px-4 py-3 text-end">
              {formatCurrency(items.reduce((s, i) => s + i.paid, 0))}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
