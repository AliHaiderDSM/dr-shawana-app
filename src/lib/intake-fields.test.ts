import { describe, expect, it } from '@jest/globals';
import {
  bmiOf,
  dateInput,
  displayToIso,
  feetInput,
  INTAKE_PARTS,
  missing,
  problems,
  toApi,
  toggleCheck,
  toggleSurgery,
  toValues,
} from './intake-fields';

const basic = INTAKE_PARTS.find((p) => p.id === 'basic')!;
const history = INTAKE_PARTS.find((p) => p.id === 'history')!;

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

  it('fills the full medical history like the website', () => {
    expect(dateInput('05102026')).toBe('05-10-2026');
    expect(displayToIso('05-10-2026')).toBe('2026-10-05');
    expect(displayToIso('31-02-2026')).toBeNull();
    expect(toggleSurgery([{ type: 'c_section', year: '2015' }], 'no_surgery')).toEqual([
      { type: 'no_surgery', year: '' },
    ]);
    expect(toggleSurgery([{ type: 'no_surgery', year: '' }], 'myomectomy')).toEqual([
      { type: 'myomectomy', year: '' },
    ]);

    const values = toValues(history, {
      havingPeriods: 'yes',
      lastPeriodDate: '2026-10-05',
      surgeries: [{ type: 'hysterectomy', date: null, year: 2019 }],
      familyHistory: [{ relative: 'mother', who: null, conditions: ['other'], other: 'Thyroid' }],
    });
    expect(values.lastPeriodDate).toBe('05-10-2026');
    expect(problems(history, values)).toEqual({ cycle: 'Required' });
    const body = toApi(history, { ...values, cycle: 'regular', dub: true });
    expect(body).toMatchObject({
      lastPeriodDate: '2026-10-05',
      dub: false,
      surgeries: [{ type: 'hysterectomy', year: 2019 }],
      familyHistory: [{ relative: 'mother', who: null, conditions: ['other'], other: 'Thyroid' }],
    });
    expect(problems(history, { ...values, cycle: 'regular', lastPeriodDate: '5-10' })).toEqual({
      lastPeriodDate: 'Use day-month-year, e.g. 05-10-2026',
    });
  });
});
