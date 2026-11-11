import { describe, expect, it } from '@jest/globals';
import { bmiOf, feetInput, INTAKE_PARTS, missing, toApi, toggleCheck, toValues } from './intake-fields';

const basic = INTAKE_PARTS.find((p) => p.id === 'basic')!;

describe('intake fields', () => {
  it('adds the point to the height like the website', () => {
    expect(feetInput('54')).toBe('5.4');
    expect(feetInput('5')).toBe('5');
    expect(feetInput('5.11')).toBe('5.11');
  });

  it('lets None clear its group and any choice clear None', () => {
    const group = ['diabetes', 'nafld', 'no_metabolic'];
    expect(toggleCheck(['diabetes', 'pcos'], 'no_metabolic', group)).toEqual(['pcos', 'no_metabolic']);
    expect(toggleCheck(['no_metabolic'], 'nafld', group)).toEqual(['nafld']);
    expect(toggleCheck(['nafld'], 'nafld', group)).toEqual([]);
  });

  it('starts from the patient record and sends hidden answers as empty', () => {
    const values = toValues(basic, null, { name: 'Ayesha', age: 48, city: 'Lahore', country: null });
    expect(values).toMatchObject({ name: 'Ayesha', age: '48', city: 'Lahore', country: '' });
    expect(missing(basic, values)).toEqual(['country', 'weightKg', 'heightFeet', 'maritalStatus']);

    const filled = {
      ...values,
      country: 'Pakistan',
      weightKg: '70',
      heightFeet: '5.4',
      maritalStatus: 'single',
      marriedYears: '5',
    };
    expect(missing(basic, filled)).toEqual([]);
    expect(toApi(basic, filled)).toMatchObject({
      age: 48,
      weightKg: 70,
      heightFeet: 5.4,
      marriedYears: null,
      hasKids: null,
    });
    expect(bmiOf(filled)).toEqual({ value: '25.8', label: 'Overweight' });
  });
});
