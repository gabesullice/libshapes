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

  const tray = new Set(history.input.ignore);
  const spaces = new Set(history.input.spaces);

  const shouldKeep = (ignore) => {
    return function () {
      return [...arguments].every(id => !ignore.has(id));
    }
  };

  check(`Can validate a composition - Test #${index}`, t => {
    const C = composition.fromHistory(history.input.history);
    const overlapping = C.overlapping(true)
      .filter(pair => shouldKeep(tray)(pair.a, pair.b))
      .filter(pair => shouldKeep(spaces)(pair.a, pair.b));
    const nonCoincident = C.nonCoincident().filter(id => shouldKeep(tray)(id));
    const nonIntegrated = C.nonIntegrated().filter(id => shouldKeep(tray)(id));
    const floats = C.floats().filter(id => shouldKeep(tray)(id));
    if (index == 1) {
      //console.log(printComposition(C));
      //console.log(printFigure(C.get('fig-2')));
      //console.log('---');
      //console.log(printFigure(C.get('fig-8')));
      //console.log('---');
      //console.log(printFigure(C.get('fig-9')));
    }
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
