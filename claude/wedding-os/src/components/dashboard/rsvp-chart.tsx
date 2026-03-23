'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RsvpChartProps {
  accepted: number;
  declined: number;
  pending: number;
}

const COLORS = ['#34d399', '#fb7185', '#fbbf24'];

export function RsvpChart({ accepted, declined, pending }: RsvpChartProps) {
  const data = [
    { name: 'Accepted', value: accepted },
    { name: 'Declined', value: declined },
    { name: 'Pending', value: pending },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-400">No RSVP data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
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
