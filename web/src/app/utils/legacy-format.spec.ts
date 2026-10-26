import { describe, expect, it } from 'vitest';
import { formatTaskLabel } from './legacy-format';

describe('formatTaskLabel', () => {
  it('formats priority and owner', () => {
    expect(formatTaskLabel({ priority: 'high', owner: 'student' })).toBe('HIGH · STUDENT');
  });

  it('returns a fallback label for missing task data', () => {
    expect(formatTaskLabel(null)).toBe('SIN-DATOS');
  });

  it('uses fallback priority and owner labels', () => {
    expect(formatTaskLabel({})).toBe('NORMAL · SIN-ASIGNAR');
  });
});
