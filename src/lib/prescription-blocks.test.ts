import { describe, expect, it } from '@jest/globals';
import { prescriptionBlocks } from './prescription-blocks';

const item = (id: string, category: string, groupName: string | null) => ({ id, category, groupName });

describe('prescriptionBlocks', () => {
  it('puts items under the same headings as the printed prescription', () => {
    const blocks = prescriptionBlocks([
      item('a', 'bhrt', 'Estradiol BHRT'),
      item('b', 'supplement', 'Supplements'),
      item('c', 'glp', "GLP's"),
      item('d', 'supplement', 'Supplements'),
      item('e', 'lab', null),
      item('f', 'mystery', null),
    ]);
    expect(blocks.map((b) => b.title)).toEqual(['Blood work', 'Supplements', 'Treatments', 'Other']);
    expect(blocks[0]?.groups).toEqual([{ name: 'Lab tests', items: [item('e', 'lab', null)] }]);
    expect(blocks[1]?.groups.map((g) => [g.name, g.items.map((i) => i.id)])).toEqual([
      ['Supplements', ['b', 'd']],
      ["GLP's", ['c']],
    ]);
    expect(blocks[3]?.groups[0]?.name).toBe('Other');
  });

  it('returns nothing for an empty prescription', () => {
    expect(prescriptionBlocks([])).toEqual([]);
  });
});
