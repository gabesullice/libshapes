import test from "ava";
import * as vertex from "../lib/Vertex.js";
import Shape from "../lib/Shape.js";

test("Can instantiate a Shape", t => {
  const rightTriangle = new Shape([[0,0], [1,0], [0,1]]);
  const square = new Shape([[0,0], [1,0], [1,1], [0,1]]);
});

test("Can get vertices from a Shape", t => {
  const len = 1;
  const height = Math.sqrt(len - Math.pow(len/2, 2))
  const isoTriangle = new Shape([[0,0], [(len/2),height], [len,0]]);
  const expected = [
    new vertex.Vertex(0, 0),
    new vertex.Vertex(len/2, height),
    new vertex.Vertex(len, 0)
  ];
  isoTriangle.vertices().forEach((v, i) => {
    t.true(vertex.same(v, expected[i]));
  });
});

test("Can rotate a Shape", t => {
  const original = new Shape([[0,0], [0,2], [2,0]]);
  const expected = new Shape([[0,0], [-2,0], [0,2]]);
  const angle = Math.PI/2; // 90' counter-clockwise
  const actual = original.rotate(angle);
  actual.vertices().forEach((v, i) => {
    const vs = expected.vertices();
    t.true(vertex.same(v, vs[i]));
  });
});

test("Can shift a Shape", t => {
  const tests = [
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[0,0], [0,2], [2,0]]), shift: [0,0]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[0,1], [0,3], [2,1]]), shift: [0,1]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[1,0], [1,2], [3,0]]), shift: [1,0]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[1,1], [1,3], [3,1]]), shift: [1,1]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[-1,-1], [-1,1], [1,-1]]), shift: [-1,-1]},
  ];
  tests.forEach(test => {
    const actual = test.o.shift(test.shift);
    actual.vertices().forEach((v, i) => {
      const vs = test.e.vertices();
      t.true(vertex.same(v, vs[i]));
    });
  });
});
