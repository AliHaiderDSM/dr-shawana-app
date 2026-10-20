import { describe, expect, it } from '@jest/globals';
import { smoothPath } from './smooth-path';

describe('smoothPath', () => {
  it('draws nothing for no points and a straight line for two', () => {
    expect(smoothPath([])).toBe('');
    expect(
      smoothPath([
        { x: 0, y: 10 },
        { x: 50, y: 20 },
      ]),
    ).toBe('M0.0,10.0 L50.0,20.0');
  });

  it('curves through every point', () => {
    const d = smoothPath([
      { x: 0, y: 100 },
      { x: 50, y: 0 },
      { x: 100, y: 60 },
      { x: 150, y: 20 },
    ]);
    expect(d.startsWith('M0.0,100.0 C')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    expect(d).toContain(' 50.0,0.0');
    expect(d).toContain(' 100.0,60.0');
    expect(d.endsWith(' 150.0,20.0')).toBe(true);
  });
});
