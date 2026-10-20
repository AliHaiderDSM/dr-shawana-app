import { describe, expect, it } from '@jest/globals';
import { groupRecords } from './record-groups';

const record = (id: string, createdAt: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'medical_record',
  date: '2026-10-17',
  note: null,
  uploadedByPatient: true,
  branch: 'Islamabad',
  createdAt,
  files: [{ id: `f-${id}` }],
  ...extra,
});

describe('groupRecords', () => {
  it('puts files uploaded together in one group and a later upload in its own', () => {
    const groups = groupRecords([
      record('a', '2026-10-17T10:00:00Z'),
      record('b', '2026-10-17T10:01:30Z'),
      record('c', '2026-10-17T15:00:00Z'),
    ]);
    expect(groups.map((g) => g.files.map((f) => f.id))).toEqual([['f-c'], ['f-b', 'f-a']]);
    expect(groups[0]).toMatchObject({ branch: 'Islamabad', uploadedByPatient: true });
  });

  it('keeps branches, types and sources apart', () => {
    const groups = groupRecords([
      record('a', '2026-10-17T10:00:00Z'),
      record('b', '2026-10-17T10:00:10Z', { branch: 'Karachi' }),
      record('c', '2026-10-17T10:00:20Z', { type: 'imaging' }),
      record('d', '2026-10-17T10:00:30Z', { uploadedByPatient: false }),
    ]);
    expect(groups).toHaveLength(4);
  });

  it('collects distinct notes', () => {
    const groups = groupRecords([
      record('a', '2026-10-17T10:00:00Z', { note: 'CBC' }),
      record('b', '2026-10-17T10:00:05Z', { note: 'CBC' }),
      record('c', '2026-10-17T10:00:09Z', { note: 'Thyroid' }),
    ]);
    expect(groups[0]?.notes).toEqual(['Thyroid', 'CBC']);
  });
});
