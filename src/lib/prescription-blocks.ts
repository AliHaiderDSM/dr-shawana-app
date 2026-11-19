export const PRESCRIPTION_CATEGORY_LABELS: Record<string, string> = {
  lab: 'Lab tests',
  imaging: 'Imaging',
  genetic: 'Genetic tests',
  supplement: 'Supplements',
  medicine: 'Medicines',
  glp: 'GLP',
  skin_care: 'Skin care',
  hair_care: 'Hair care',
  bhrt: 'BHRT',
  symptom: 'Symptom care',
};

const BLOCKS: { title: string; categories: string[] }[] = [
  { title: 'Blood work', categories: ['lab'] },
  { title: 'Imaging', categories: ['imaging', 'genetic'] },
  { title: 'Supplements', categories: ['supplement', 'medicine', 'glp'] },
  { title: 'Skin care', categories: ['skin_care'] },
  { title: 'Hair care', categories: ['hair_care'] },
  { title: 'Treatments', categories: ['bhrt'] },
  { title: 'Symptoms', categories: ['symptom'] },
];

const KNOWN = new Set(BLOCKS.flatMap((b) => b.categories));

export interface BlockItem {
  category: string;
  groupName: string | null;
}

export interface PrescriptionBlock<T> {
  title: string;
  groups: { name: string; items: T[] }[];
}

function groupsOf<T extends BlockItem>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const name = item.groupName?.trim() || PRESCRIPTION_CATEGORY_LABELS[item.category] || 'Other';
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return [...groups].map(([name, grouped]) => ({ name, items: grouped }));
}

export function prescriptionBlocks<T extends BlockItem>(items: T[]): PrescriptionBlock<T>[] {
  const blocks = BLOCKS.map((block) => ({
    title: block.title,
    groups: groupsOf(items.filter((item) => block.categories.includes(item.category))),
  }));
  const other = items.filter((item) => !KNOWN.has(item.category));
  return [...blocks, { title: 'Other', groups: groupsOf(other) }].filter((block) => block.groups.length > 0);
}
