import * as composition from '../../lib/Composition';
import fs from 'fs';
import test from 'ava';

test('Can validate a composition', t => {
  const cases = [
    {
      input: {
        history: JSON.parse(fs.readFileSync('tests/data/history-003-caterpillar.json')),
        ignore: [
          'fig-0',
          'fig-1',
          'fig-2',
          'fig-3',
          'fig-4',
          'fig-5',
          'fig-6',
          'fig-8',
          'fig-9',
          'fig-11',
          'fig-17',
          'fig-19',
          'fig-23',
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
