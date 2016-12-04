import test from "ava";
import * as vertex from "../lib/Vertex";

test("Can instantiate a Vertex", t => {
  const v = new vertex.Vertex(0, 0);
  t.is(v.x, 0)
  t.is(v.y, 0)
});

test("Can compare two vertices", t => {
  const coords = [
    {x1: 0, y1: 0, x2: 0, y2: 0, expect: true},
    {x1: 0, y1: 1, x2: 0, y2: 1, expect: true},
    {x1: 1, y1: 0, x2: 1, y2: 0, expect: true},
    {x1: 1, y1: 1, x2: 1, y2: 1, expect: true},
    {x1: 1, y1: 0, x2: 0, y2: 0, expect: false},
    {x1: 1, y1: 0, x2: 0, y2: 1, expect: false},
    {x1: 0, y1: 1, x2: 1, y2: 0, expect: false},
    {x1: 0.000001, y1: 0, x2: 0.000002, y2: 0, expect: false},
    {x1: 0.0000001, y1: 0, x2: 0.0000002, y2: 0, expect: true},
  ];
  coords.forEach(test => {
    const va = new vertex.Vertex(test.x1, test.y1);
    const vb = new vertex.Vertex(test.x2, test.y2);
    t.is(vertex.same(va, vb), test.expect)
  });
});

test("Can rotate a Vertex", t => {
  // Rotate the point (0,2) counter-clockwise about the origin (0,0) in 90'
  // increments. Must use radians.
  const tests = [
    {o: [0,2], e: [-2,0], angle: Math.PI/2},   // 90' counter-clockwise
    {o: [0,2], e: [0,-2], angle: Math.PI},     // 180' counter-clockwise
    {o: [0,2], e: [2,0],  angle: 3*Math.PI/2}, // 270' counter-clockwise
    {o: [0,2], e: [0,2],  angle: 2*Math.PI},   // 360' counter-clockwise
  ];
  tests.forEach(test => {
    const vo = new vertex.Vertex(test.o[0], test.o[1]);
    const ve = new vertex.Vertex(test.e[0], test.e[1]);
    t.true(vertex.same(vertex.rotate(vo, test.angle), ve));
  });
});

test("Can translate a Vertex", t => {
  // Rotate the point (0,2) counter-clockwise about the origin (0,0) in 90'
  // increments. Must use radians.
  const tests = [
    {o: [2,3], e: [2,3], translation: [0,0]},
    {o: [2,3], e: [2,4], translation: [0,1]},
    {o: [2,3], e: [3,3], translation: [1,0]},
    {o: [2,3], e: [3,4], translation: [1,1]},
    {o: [2,3], e: [2,2], translation: [0,-1]},
    {o: [2,3], e: [1,2], translation: [-1,-1]},
  ];
  tests.forEach(test => {
    const vo = new vertex.Vertex(test.o[0], test.o[1]);
    const ve = new vertex.Vertex(test.e[0], test.e[1]);
    t.true(vertex.same(vertex.translate(vo, test.translation), ve));
  });
});
