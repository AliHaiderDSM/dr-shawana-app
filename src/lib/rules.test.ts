import { describe, expect, it } from '@jest/globals';
import { MAX_UPLOAD_BYTES, normalizeType, validateFile } from '@/features/documents/file-rules';
import { errorMessage, fieldErrors, isOffline } from './errors';
import { isValidPhone } from './phone';

describe('phone numbers', () => {
  it('accepts the formats patients type', () => {
    expect(isValidPhone('0300 1234567')).toBe(true);
    expect(isValidPhone('+92 300 1234567')).toBe(true);
    expect(isValidPhone('3001234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
  });
});

describe('upload rules', () => {
  it('works out the type from the name when the picker gives none', () => {
    expect(normalizeType('scan.PDF', null)).toBe('application/pdf');
    expect(normalizeType('photo.jpg', 'image/jpg')).toBe('image/jpeg');
    expect(normalizeType('a.heic', 'image/heic')).toBe('image/heic');
  });

  it('rejects other types and files over the limit', () => {
    const base = { uri: 'file:///a', name: 'a.pdf', mimeType: 'application/pdf', size: 1000 };
    expect(validateFile(base)).toBeNull();
    expect(validateFile({ ...base, mimeType: 'image/heic' })).toMatch(/PDF or a photo/);
    expect(validateFile({ ...base, size: MAX_UPLOAD_BYTES + 1 })).toMatch(/limit/);
  });
});

describe('error messages', () => {
  it('explains offline, server and validation errors', () => {
    expect(isOffline({ status: 'FETCH_ERROR', error: 'x' })).toBe(true);
    expect(errorMessage({ status: 'FETCH_ERROR', error: 'x' })).toMatch(/internet/);
    expect(errorMessage({ status: 503, data: {} })).toMatch(/not responding/);
    const invalid = {
      status: 400,
      data: {
        error: { message: 'Validation failed', details: [{ path: 'body.subject', message: 'Too short' }] },
      },
    };
    expect(errorMessage(invalid)).toBe('Too short');
    expect(fieldErrors(invalid)).toEqual({ subject: 'Too short' });
    expect(
      errorMessage({ status: 401, data: { error: { message: 'Phone number or password is incorrect' } } }),
    ).toBe('Phone number or password is incorrect');
  });
});
