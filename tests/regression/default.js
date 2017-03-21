import * as composition from '../../src/Composition';
import fs from 'fs';
import test from 'ava';

const DATA_DIRECTORY = 'tests/data';
const PREFIXES = ['bug-report'];

const histories = fs.readdirSync(DATA_DIRECTORY)
  .filter(fileName => PREFIXES.some(prefix => fileName.startsWith(prefix)))
  .map(fileName => {
    return fs.readFileSync(`${DATA_DIRECTORY}/${fileName}`);
  })
  .map(data => {
    return JSON.parse(data);
  });

histories.forEach((history, index) => {
  const check = (history.failing) ? test.failing : test;

  const ignore = new Set(history.input.ignore.concat(history.input.spaces));
  const shouldKeep = function () {
    return [...arguments].every(id => !ignore.has(id));
  };

  check(`Can validate a composition - Test #${index}`, t => {
    const C = composition.fromHistory(history.input.history);
    const overlapping = C.overlapping().filter(pair => shouldKeep(pair.a, pair.b));
    const nonCoincident = C.nonCoincident().filter(id => shouldKeep(id));
    const nonIntegrated = C.nonIntegrated().filter(id => shouldKeep(id));
    const floats = C.floats().filter(id => shouldKeep(id));
    t.is(overlapping.length, 0);
    t.is(nonCoincident.length, 0);
    t.is(nonIntegrated.length, 0);
    t.is(floats.length, 0);
  });
});

function printComposition(C) {
  return Object.values(C.figures())
    .map(F => printFigure(F))
    .join('\n');
}

function printFigure(F) {
  return F.vertices()
    .map(V => printVertex(V))
    .join('\n');
}

function printVertex(V) {
   return [V.x, V.y].join(',');
}
