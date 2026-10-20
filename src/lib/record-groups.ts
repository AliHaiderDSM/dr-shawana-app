export interface GroupableRecord {
  id: string;
  type: string;
  date: string;
  note: string | null;
  uploadedByPatient: boolean;
  branch?: string | null;
  createdAt?: string | null;
  files: { id: string }[];
}

export interface RecordGroup<T extends GroupableRecord> {
  key: string;
  date: string;
  type: T['type'];
  branch: string | null;
  uploadedByPatient: boolean;
  notes: string[];
  files: T['files'][number][];
}

const SAME_UPLOAD_MS = 10 * 60_000;

const time = (iso?: string | null) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
};

export function groupRecords<T extends GroupableRecord>(records: T[]): RecordGroup<T>[] {
  const sorted = [...records].sort(
    (a, b) => b.date.localeCompare(a.date) || (time(b.createdAt) ?? 0) - (time(a.createdAt) ?? 0),
  );
  const groups: (RecordGroup<T> & { last: number | null })[] = [];
  for (const r of sorted) {
    const at = time(r.createdAt);
    const prev = groups[groups.length - 1];
    const joins =
      prev &&
      prev.date === r.date &&
      prev.type === r.type &&
      prev.branch === (r.branch ?? null) &&
      prev.uploadedByPatient === r.uploadedByPatient &&
      at !== null &&
      prev.last !== null &&
      Math.abs(prev.last - at) <= SAME_UPLOAD_MS;
    if (prev && joins) {
      prev.files.push(...r.files);
      if (r.note && !prev.notes.includes(r.note)) prev.notes.push(r.note);
      prev.last = at;
      continue;
    }
    groups.push({
      key: r.id,
      date: r.date,
      type: r.type,
      branch: r.branch ?? null,
      uploadedByPatient: r.uploadedByPatient,
      notes: r.note ? [r.note] : [],
      files: [...r.files],
      last: at,
    });
  }
  return groups.map(({ last: _last, ...g }) => g);
}
