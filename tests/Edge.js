import test from "ava";
import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";

test("Can instantiate an Edge", t => {
  const edge = new edges.Edge([[0,0], [1,1]]);
});

test("Can derive a slope from an Edge", t => {
  const tests = [
    {input: [[0,0], [1,1]], expected: 1},
    {input: [[0,0], [2,2]], expected: 1},
    {input: [[1,1], [2,2]], expected: 1},
    {input: [[0,0], [1,2]], expected: 2},
    {input: [[0,0], [2,1]], expected: 1/2},
    {input: [[0,5], [5,0]], expected: -1},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.input);
    t.is(e.slope(), test.expected);
  });
});

test("Can get vertices of an Edge", t => {
  const tests = [
    {input: [[0,0], [1,1]], expected: [new vertex.Vertex(0,0), new vertex.Vertex(1,1)]},
    {input: [[1,1], [2,2]], expected: [new vertex.Vertex(1,1), new vertex.Vertex(2,2)]},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.input);
    t.deepEqual(e.vertices(), test.expected);
  });
});

test("Can detect the intersection of two Edges", t => {
  const tests = [
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: true},
    {input: [[[0,0], [1,1]], [[0,2], [1,1]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false},
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.intersect(e0, e1), test.expected);
  });
});