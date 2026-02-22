import { describe, it, expect } from 'vitest';
import { guestSchema } from '@/lib/validations';

describe('Guest Import Validation', () => {
  it('should validate a valid guest', () => {
    const result = guestSchema.safeParse({
      firstName: 'Sarah',
      lastName: 'Cohen',
      email: 'sarah@example.com',
      group: 'Family',
    });

    expect(result.success).toBe(true);
  });

  it('should require first name', () => {
    const result = guestSchema.safeParse({
      firstName: '',
      lastName: 'Cohen',
    });

    expect(result.success).toBe(false);
  });

  it('should require last name', () => {
    const result = guestSchema.safeParse({
      firstName: 'Sarah',
      lastName: '',
    });

    expect(result.success).toBe(false);
  });

  it('should accept empty email', () => {
    const result = guestSchema.safeParse({
      firstName: 'Sarah',
      lastName: 'Cohen',
      email: '',
    });

    expect(result.success).toBe(true);
  });

  it('should validate email format', () => {
    const result = guestSchema.safeParse({
      firstName: 'Sarah',
      lastName: 'Cohen',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });

  it('should accept tags as array', () => {
    const result = guestSchema.safeParse({
      firstName: 'Sarah',
      lastName: 'Cohen',
      tags: ['Family', 'VIP'],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['Family', 'VIP']);
    }
  });

  describe('CSV parsing logic', () => {
    it('should parse CSV line into guest fields', () => {
      const csvLine = 'Sarah,Cohen,sarah@example.com,054-1234567,Family';
      const headers = ['firstname', 'lastname', 'email', 'phone', 'group'];
      const values = csvLine.split(',');

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      expect(row.firstname).toBe('Sarah');
      expect(row.lastname).toBe('Cohen');
      expect(row.email).toBe('sarah@example.com');
      expect(row.phone).toBe('054-1234567');
      expect(row.group).toBe('Family');
    });

    it('should handle missing optional fields', () => {
      const csvLine = 'David,Levy,,,,';
      const headers = ['firstname', 'lastname', 'email', 'phone', 'group'];
      const values = csvLine.split(',');

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      expect(row.firstname).toBe('David');
      expect(row.lastname).toBe('Levy');
      expect(row.email).toBe('');
    });
  });
});
