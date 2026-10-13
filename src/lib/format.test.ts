import { describe, expect, it } from '@jest/globals';
import { firstName, formatDate, formatSize, formatTime, greeting, htmlToText, initials } from './format';

describe('format', () => {
  it('formats dates without shifting the day', () => {
    expect(formatDate('2026-09-01')).toBe('1 Sep 2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('nonsense')).toBe('—');
  });

  it('formats clock times for patients', () => {
    expect(formatTime('00:05')).toBe('12:05 AM');
    expect(formatTime('13:30:00')).toBe('1:30 PM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('shows sizes in KB or MB', () => {
    expect(formatSize(512)).toBe('1 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
    expect(formatSize(null)).toBe('');
  });

  it('greets by the time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening');
  });

  it('builds names and initials from long or short names', () => {
    expect(firstName('  Ayesha   Khan ')).toBe('Ayesha');
    expect(initials('Ayesha Bibi Khan')).toBe('AK');
    expect(initials('Sara')).toBe('SA');
  });

  it('turns the doctor plan HTML into plain text', () => {
    expect(htmlToText('<p>Start BHRT</p><ul><li>Walk daily</li><li>Sleep &amp; rest</li></ul>')).toBe(
      'Start BHRT\n\n• Walk daily\n• Sleep & rest',
    );
    expect(htmlToText('<script>alert(1)</script>Safe')).toBe('alert(1)Safe');
    expect(htmlToText(null)).toBe('');
  });
});
