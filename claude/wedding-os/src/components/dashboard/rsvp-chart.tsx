'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RsvpChartProps {
  accepted: number;
  declined: number;
  pending: number;
}

const COLORS = ['#22c55e', '#ef4444', '#eab308'];

export function RsvpChart({ accepted, declined, pending }: RsvpChartProps) {
  const data = [
    { name: 'Accepted', value: accepted },
    { name: 'Declined', value: declined },
    { name: 'Pending', value: pending },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground">No RSVP data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
