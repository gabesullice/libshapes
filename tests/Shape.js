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
