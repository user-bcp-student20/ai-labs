import { describe, expect, it } from 'vitest';
import { getHttpErrorMessage } from './http-error-message';

describe('getHttpErrorMessage', () => {
  it('uses a string message from the selected response field', () => {
    expect(getHttpErrorMessage({ response: { data: { message: 'Access denied' } } }, 'message', 'Fallback'))
      .toBe('Access denied');
  });

  it('falls back to the error message when the response field is absent', () => {
    expect(getHttpErrorMessage(new Error('Network unavailable'), 'detail', 'Fallback'))
      .toBe('Network unavailable');
  });

  it('uses the generic fallback for non-object or uninformative errors', () => {
    expect(getHttpErrorMessage(null, 'message', 'Fallback')).toBe('Fallback');
    expect(getHttpErrorMessage({ response: { data: { message: 123 } } }, 'message', 'Fallback'))
      .toBe('Fallback');
  });
});