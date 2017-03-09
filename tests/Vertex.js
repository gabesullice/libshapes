import test from "ava";
import * as vertex from "../src/Vertex";

test("Can instantiate a Vertex", t => {
  const v = new vertex.Vertex(0, 0);
  t.is(v.x, 0)
  t.is(v.y, 0)
});

test("Can normalize a Vertex", t => {
  const cases = [
    {input: [ 0, 0], expected: {type: "vertex", data: {x:  0, y:  0}}},
    {input: [-1, 0], expected: {type: "vertex", data: {x: -1, y:  0}}},
    {input: [-1,-1], expected: {type: "vertex", data: {x: -1, y: -1}}},
    {input: [ 1, 1], expected: {type: "vertex", data: {x:  1, y:  1}}},
    {input: [ Infinity, 0], expected: {type: "vertex", data: {x:  Infinity, y: 0}}},
    {input: [-Infinity, 0], expected: {type: "vertex", data: {x: -Infinity, y: 0}}},
  ];
  cases.forEach(item => {
    const v = new vertex.Vertex(item.input[0], item.input[1]);
    t.deepEqual(v.normalize(), item.expected)
  });
});

test("Can denormalize a Vertex", t => {
  const cases = [
    {expected: [ 0, 0], input: {type: "vertex", data: {x:  0, y:  0}}},
    {expected: [-1, 0], input: {type: "vertex", data: {x: -1, y:  0}}},
    {expected: [-1,-1], input: {type: "vertex", data: {x: -1, y: -1}}},
    {expected: [ 1, 1], input: {type: "vertex", data: {x:  1, y:  1}}},
    {expected: [ Infinity, 0], input: {type: "vertex", data: {x:  Infinity, y: 0}}},
    {expected: [-Infinity, 0], input: {type: "vertex", data: {x: -Infinity, y: 0}}},
  ];
  cases.forEach(item => {
    const v = new vertex.Vertex(item.expected[0], item.expected[1]);
    t.deepEqual(vertex.denormalize(item.input), v)
  });
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
    {x1: 0.0001, y1: 0, x2: 0.00021, y2: 0, expect: false},
    {x1: 0.000001, y1: 0, x2: 0.000002, y2: 0, expect: true},
    {x1: 0.0000001, y1: 0, x2: 0.0000002, y2: 0, expect: true},
  ];
  coords.forEach(test => {
    const va = new vertex.Vertex(test.x1, test.y1);
    const vb = new vertex.Vertex(test.x2, test.y2);
    t.is(vertex.same(va, vb), test.expect)
  });
});

test("Can find the distance between two vertices", t => {
  const coords = [
    {x1: 0, y1: 0, x2: 0, y2: 0, expect: 0},
    {x1: 0, y1: 0, x2: 0, y2: 1, expect: 1},
    {x1: 0, y1: 0, x2: 1, y2: 0, expect: 1},
    {x1: 0, y1: 0, x2: 1, y2: 1, expect: Math.sqrt(2)},
    {x1: 0, y1: 0, x2: 1.5, y2: 1.5, expect: Math.sqrt(Math.pow(1.5, 2) * 2)},
    {x1: 1, y1: 1, x2: 1.5, y2: 1.5, expect: Math.sqrt(Math.pow(0.5, 2) * 2)},
    {x1: 0, y1: 0, x2: -1, y2: -1, expect: Math.sqrt(2)},
    {x1: 1, y1: 0, x2: 1, y2: 1, expect: 1},
  ];
  coords.forEach(test => {
    const va = new vertex.Vertex(test.x1, test.y1);
    const vb = new vertex.Vertex(test.x2, test.y2);
    t.is(vertex.distance(va, vb), test.expect)
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

test("Can reflect a vertex across an arbitrary angle", t => {
  const cases = [
    {input: [ 0, 0], expect: [ 0, 0], angle: 0},
    {input: [ 0, 0], expect: [ 0, 0], angle: Math.PI},
    {input: [ 0, 0], expect: [ 0, 0], angle: Math.PI / 2},
    {input: [ 1, 1], expect: [ 1,-1], angle: 0},
    {input: [ 1, 1], expect: [ 1,-1], angle: Math.PI},
    {input: [ 1, 1], expect: [-1, 1], angle: Math.PI / 2},
    {input: [ 1, 1], expect: [ 1, 1], angle: Math.PI / 4},
    {input: [ 0, 1], expect: [ 0,-1], angle: 0},
    {input: [ 0, 1], expect: [ 0,-1], angle: Math.PI},
    {input: [ 0, 1], expect: [ 0, 1], angle: Math.PI / 2},
    {input: [ 1, 0], expect: [ 1, 0], angle: 0},
    {input: [ 1, 0], expect: [ 1, 0], angle: Math.PI},
    {input: [ 1, 0], expect: [-1, 0], angle: Math.PI / 2},
    {input: [ 1, 1], expect: [-1,-1], angle: 3 * Math.PI / 4},
  ];
  cases.forEach(item => {
    const input = new vertex.Vertex(item.input[0], item.input[1]);
    const expect = new vertex.Vertex(item.expect[0], item.expect[1]);
    t.true(vertex.same(vertex.reflect(input, item.angle), expect));
  });
});

test("Can find the vector angle from one vertex to another", t => {
  const cases = [
    {from: [0,0], to: [0,-1], expected: 3 * Math.PI/2},
    {from: [0,0], to: [0, 1], expected: Math.PI/2},
    {from: [0,0], to: [1, 1], expected: Math.PI/4},
    {from: [0,0], to: [1, -1], expected: 7 * Math.PI/4},
    {from: [0.5,0.5], to: [0.5,-0.5], expected: 3 * Math.PI/2},
  ];
  cases.forEach(item => {
    const from = new vertex.Vertex(item.from[0], item.from[1]);
    const to = new vertex.Vertex(item.to[0], item.to[1]);
    t.is(vertex.angleBetween(from, to), item.expected);
  });
});
