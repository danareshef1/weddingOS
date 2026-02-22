import { describe, it, expect } from 'vitest';
import { rsvpSchema } from '@/lib/validations';

describe('RSVP Validation', () => {
  it('should validate a valid RSVP submission', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
      email: 'john@example.com',
      mealChoice: 'Chicken',
    });

    expect(result.success).toBe(true);
  });

  it('should require invite code', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: '',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
    });

    expect(result.success).toBe(false);
  });

  it('should require first name', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: '',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
    });

    expect(result.success).toBe(false);
  });

  it('should require last name', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: '',
      rsvpStatus: 'ACCEPTED',
    });

    expect(result.success).toBe(false);
  });

  it('should only accept ACCEPTED or DECLINED status', () => {
    const accepted = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
    });
    expect(accepted.success).toBe(true);

    const declined = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'DECLINED',
    });
    expect(declined.success).toBe(true);

    const invalid = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'MAYBE',
    });
    expect(invalid.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
      email: '',
      phone: '054-1234567',
      mealChoice: 'Vegetarian',
      allergies: 'Nuts',
      plusOneName: 'Jane Doe',
      plusOneMeal: 'Fish',
      songRequest: 'Hava Nagila',
    });

    expect(result.success).toBe(true);
  });

  it('should validate email format when provided', () => {
    const result = rsvpSchema.safeParse({
      inviteCode: 'LOVE2026',
      firstName: 'John',
      lastName: 'Doe',
      rsvpStatus: 'ACCEPTED',
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });
});
