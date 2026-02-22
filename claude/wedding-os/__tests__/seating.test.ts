import { describe, it, expect } from 'vitest';
import { tableSchema } from '@/lib/validations';

describe('Seating Validation', () => {
  it('should validate a valid table', () => {
    const result = tableSchema.safeParse({
      name: 'Table 1',
      capacity: 10,
      x: 100,
      y: 200,
    });

    expect(result.success).toBe(true);
  });

  it('should require table name', () => {
    const result = tableSchema.safeParse({
      name: '',
      capacity: 10,
    });

    expect(result.success).toBe(false);
  });

  it('should require positive capacity', () => {
    const result = tableSchema.safeParse({
      name: 'Table 1',
      capacity: 0,
    });

    expect(result.success).toBe(false);
  });

  it('should reject capacity over 20', () => {
    const result = tableSchema.safeParse({
      name: 'Table 1',
      capacity: 25,
    });

    expect(result.success).toBe(false);
  });

  it('should accept optional x and y coordinates', () => {
    const result = tableSchema.safeParse({
      name: 'Table 1',
      capacity: 8,
    });

    expect(result.success).toBe(true);
  });
});

describe('Auto-seat Algorithm', () => {
  it('should assign guests to tables respecting capacity', () => {
    // Simulate the greedy algorithm
    const tables = [
      { id: '1', capacity: 3, guests: [] as string[] },
      { id: '2', capacity: 2, guests: [] as string[] },
    ];

    const guests = [
      { id: 'g1', group: 'A' },
      { id: 'g2', group: 'A' },
      { id: 'g3', group: 'B' },
      { id: 'g4', group: 'B' },
      { id: 'g5', group: 'B' },
    ];

    // Greedy assignment
    for (const guest of guests) {
      const bestTable = tables
        .filter((t) => t.guests.length < t.capacity)
        .sort((a, b) => (b.capacity - b.guests.length) - (a.capacity - a.guests.length))[0];

      if (bestTable) {
        bestTable.guests.push(guest.id);
      }
    }

    expect(tables[0].guests.length).toBeLessThanOrEqual(tables[0].capacity);
    expect(tables[1].guests.length).toBeLessThanOrEqual(tables[1].capacity);
    expect(tables[0].guests.length + tables[1].guests.length).toBe(5);
  });

  it('should not exceed total capacity', () => {
    const tables = [
      { id: '1', capacity: 2, guests: [] as string[] },
    ];

    const guests = [
      { id: 'g1' },
      { id: 'g2' },
      { id: 'g3' }, // This one shouldn't fit
    ];

    let assigned = 0;
    for (const guest of guests) {
      const bestTable = tables
        .filter((t) => t.guests.length < t.capacity)
        .sort((a, b) => (b.capacity - b.guests.length) - (a.capacity - a.guests.length))[0];

      if (bestTable) {
        bestTable.guests.push(guest.id);
        assigned++;
      }
    }

    expect(assigned).toBe(2);
    expect(tables[0].guests.length).toBe(2);
  });
});
