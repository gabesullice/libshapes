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
    {input: [[[0,0], [1,1]], [[0,0], [1,1]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,2], [1,1]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,3], [1,2]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: true},
    {input: [[[-2,2], [0,0]], [[-2,0], [0,2]]], expected: true},
    {input: [[[-1,1], [1,-1]], [[-1,-1], [1,1]]], expected: true},
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.intersect(e0, e1), test.expected);
  });
});

test("Can determine if two edges are coincident", t => {
  const tests = [
    {input: [[[0,0], [1,1]], [[0,0], [1,1]]], expected: true}, // Same.
    {input: [[[0.25,0.25], [0.75,0.75]], [[0,0], [1,1]]], expected: true}, // First witin the second.
    {input: [[[0,0], [1,1]], [[0.25,0.25], [0.75,0.75]]], expected: true}, // Second witin the first.
    {input: [[[-1,-1], [1,1]], [[0,0], [2,2]]], expected: true}, // Same line, first then second.
    {input: [[[0,0], [2,2]], [[-1,-1], [1,1]]], expected: true}, // Same line, second then first.
    {input: [[[0,0], [1,1]], [[2,2], [3,3]]], expected: false}, // Same line, space bettween edges.
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: false}, // Intersecting.
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false}, // Parallel, but offset.
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.coincident(e0, e1), test.expected);
  });
});

test("Can find all sub-edges created two coincident edges", t => {
  const tests = [
    {input: [[[0,0], [1,1]], [[0,0], [1,1]]], expected: [[[0,0], [1,1]]]}, // Same.
    {input: [[[1,1], [2,2]], [[0,0], [3,3]]], expected: [[[0,0], [1,1]], [[1,1], [2,2]], [[2,2], [3,3]]]}, // First witin the second.
    {input: [[[0,0], [3,3]], [[1,1], [2,2]]], expected: [[[0,0], [1,1]], [[1,1], [2,2]], [[2,2], [3,3]]]}, // Second within the first.
    {input: [[[0,0], [2,2]], [[1,1], [3,3]]], expected: [[[0,0], [1,1]], [[1,1], [2,2]], [[2,2], [3,3]]]}, // Same line, first then second.
    {input: [[[1,1], [3,3]], [[0,0], [2,2]]], expected: [[[0,0], [1,1]], [[1,1], [2,2]], [[2,2], [3,3]]]}, // Same line, second then first.
    {input: [[[0,0], [1,1]], [[2,2], [3,3]]], expected: []}, // Same line, space bettween edges.
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: []}, // Intersecting.
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: []}, // Parallel, but offset.
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    const expected = test.expected.map(points => {
      return new edges.Edge(points);
    });
    t.deepEqual(edges.subsect(e0, e1), expected);
  });
});
