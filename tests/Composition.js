import test from "ava";
import Shape from "../lib/Shape.js";
import * as composition from "../lib/Composition";

test("Can create a new composition of shapes", t => {
  const tests = [
    {values: []},
    {values: [new Shape([[0,0], [0,1], [1,0]])]}, // right triangle
    {values: [new Shape([[0,0], [0,1], [1,1], [1,0]]), new Shape([[0,0], [0,1], [1,0]])]}, // square and right triangle
  ];
  tests.forEach(test => {
    const c = new composition.Composition(test.values);
    t.deepEqual(c._shapes, test.values);
  });
});

//test("Can find overlapping shapes within a composition", t => {
//
//});
