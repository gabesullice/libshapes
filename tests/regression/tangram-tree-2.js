import * as composition from '../../src/Composition';
import fs from 'fs';
import test from 'ava';

test('Can validate a composition', t => {
  const cases = [
    {
      input: {
        history: JSON.parse(fs.readFileSync('tests/data/history-002-tree.json')),
        ignore: [
          'fig-0',
          'fig-1',
          'fig-2',
          'fig-7',
          'fig-9',
          'fig-10',
          'fig-12',
        ],
      },
      expected: [],
    },
  ];

  cases.forEach(item => {
    const C = composition.fromHistory(item.input.history);
    const overlapping = C.overlapping();
    const ignores = new Set(item.input.ignore);
    const ignore = pair => !ignores.has(pair.a) && !ignores.has(pair.b);
    t.deepEqual(overlapping.filter(ignore), item.expected);
  });
});
