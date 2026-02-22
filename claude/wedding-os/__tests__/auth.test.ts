import { describe, it, expect } from 'vitest';
import { registerSchema, onboardingSchema } from '@/lib/validations';

describe('Registration Validation', () => {
  it('should validate a valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('should require a valid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should require email', () => {
    const result = registerSchema.safeParse({
      email: '',
      password: 'password123',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should require password of at least 6 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
      name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('should accept password of exactly 6 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      name: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('should require name', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('Onboarding Validation', () => {
  it('should validate valid onboarding data', () => {
    const result = onboardingSchema.safeParse({
      brideName: 'Sarah',
      groomName: 'David',
      venue: 'Garden Venue',
      weddingDate: '2026-09-15',
    });
    expect(result.success).toBe(true);
  });

  it('should require bride name', () => {
    const result = onboardingSchema.safeParse({
      brideName: '',
      groomName: 'David',
      venue: 'Garden Venue',
      weddingDate: '2026-09-15',
    });
    expect(result.success).toBe(false);
  });

  it('should require groom name', () => {
    const result = onboardingSchema.safeParse({
      brideName: 'Sarah',
      groomName: '',
      venue: 'Garden Venue',
      weddingDate: '2026-09-15',
    });
    expect(result.success).toBe(false);
  });

  it('should require venue', () => {
    const result = onboardingSchema.safeParse({
      brideName: 'Sarah',
      groomName: 'David',
      venue: '',
      weddingDate: '2026-09-15',
    });
    expect(result.success).toBe(false);
  });

  it('should require wedding date', () => {
    const result = onboardingSchema.safeParse({
      brideName: 'Sarah',
      groomName: 'David',
      venue: 'Garden Venue',
      weddingDate: '',
    });
    expect(result.success).toBe(false);
  });
});
