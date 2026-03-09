'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { BudgetItem } from '@prisma/client';

const COLORS = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb7185', '#818cf8', '#2dd4bf'];

export function BudgetChart({ items }: { items: BudgetItem[] }) {
  const categories = new Map<string, number>();
  for (const item of items) {
    categories.set(item.category, (categories.get(item.category) || 0) + item.estimated);
  }

  const data = Array.from(categories.entries()).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">No budget data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={95} dataKey="value" label strokeWidth={0}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(value)
          }
          contentStyle={{
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            fontSize: '0.875rem',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '0.8125rem', color: '#6b7280' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
