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
    {input: [[0,1], [0,0]], expected: -Infinity},
    {input: [[0,0], [0,1]], expected: Infinity},
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

test("Can get specific vertices of an edge", t => {
  const v0 = new vertex.Vertex(0, 0), v1 = new vertex.Vertex(1,1);
  const edge = new edges.Edge([[v0.x, v0.y], [v1.x, v1.y]]);
  t.true(vertex.same(v0, edge.left()), "Can get the left vertex of an edge");
  t.true(vertex.same(v1, edge.right()), "Can get the right vertex of an edge");
  t.true(vertex.same(v0, edge.bottom()), "Can get the bottom vertex of an edge");
  t.true(vertex.same(v1, edge.top()), "Can get the top vertex of an edge");
  t.true(vertex.same(v0, edge.opposite(v1)), "Can get the opposite vertex of an edge");
  t.true(vertex.same(v1, edge.opposite(v0)), "Can get the opposite vertex of an edge");
});

test("Can get the length of an Edge", t => {
  const tests = [
    {input: [[0,0], [1,1]], expected: vertex.distance(new vertex.Vertex(0,0), new vertex.Vertex(1,1))},
    {input: [[1,1], [2,2]], expected: vertex.distance(new vertex.Vertex(1,1), new vertex.Vertex(2,2))},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.input);
    t.deepEqual(e.length(), test.expected);
  });
});

test("Can get the midpoint of an Edge", t => {
  const tests = [
    {input: [[0,0], [1,1]], expected: [.5,.5]},
    {input: [[1,1], [2,2]], expected: [1.5,1.5]},
    {input: [[-2,-2], [2,2]], expected: [0,0]},
    {input: [[0,-1], [0,1]], expected: [0,0]},
    {input: [[-1,0], [1,0]], expected: [0,0]},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.input);
    const mp = e.midpoint();
    t.deepEqual([mp.x,mp.y], test.expected);
  });
});

test("Can detect that two edges are the same", t => {
  const tests = [
    {input: [[[ 0.0, 0.0], [ 1.0, 1.0]], [[ 0.0, 0.0], [ 1.0, 1.0]]], expected: true},
    {input: [[[ 0.0, 0.0], [ 1.0, 1.0]], [[ 1.0, 1.0], [ 0.0, 0.0]]], expected: true},
    {input: [[[ 0.0, 0.0], [ 0.0, 1.0]], [[ 0.0, 1.0], [ 0.0, 0.0]]], expected: true},
    {input: [[[ 0.0, 0.0], [ 1.0, 0.0]], [[ 1.0, 0.0], [ 0.0, 0.0]]], expected: true},
    {input: [[[ 0.0, 0.0], [ 1.0, 0.0]], [[ 1.0, 0.0], [ 0.0, 0.0]]], expected: true},
    {input: [[[-0.5, 0.5], [ 0.5, 0.5]], [[ 0.5, 0.5], [-0.5, 0.5]]], expected: true},
    {input: [[[ 0.0, 0.0], [ 1.0, 0.0]], [[ 2.0, 0.0], [ 0.0, 0.0]]], expected: false},
    {input: [[[ 0.0, 0.0], [ 1.0, 1.0]], [[ 0.0, 2.0], [ 1.0, 1.0]]], expected: false},
    {input: [[[ 0.0, 0.0], [ 2.0, 2.0]], [[ 1.0, 0.0], [ 1.0, 2.0]]], expected: false},
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.same(e0, e1), test.expected);
  });
});

test("Can detect the intersection of two Edges", t => {
  const tests = [
    {input: [[[0,0], [1,1]], [[0,0], [1,1]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,2], [1,1]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,3], [1,2]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false},
    {input: [[[0,2], [2,0]], [[1,4], [1,3]]], expected: false},
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: true},
    {input: [[[-2,2], [0,0]], [[-2,0], [0,2]]], expected: true},
    {input: [[[-1,1], [1,-1]], [[-1,-1], [1,1]]], expected: true},
    {input: [[[2,1], [3,0]], [[2.5,0], [2.5,1]]], expected: true},
    {input: [[[2.5,0], [2.5,1]], [[2,1], [3,0]]], expected: true},
    {input: [[[2,1], [3,0]], [[2,0.5], [3,0.5]]], expected: true},
    {input: [[[2,1], [3,0]], [[2,0.5], [3,0.5]]], expected: true},
    {input: [[[0,2], [2,2]], [[1,3], [1,1]]], expected: true},
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.intersect(e0, e1), test.expected);
  });
});

test("Can determine if two edges are coincident", t => {
  const tests = [
    {input: [[[0,0], [1,1]], [[0,0], [1,1]]], expected: true}, // Same.
    {input: [[[0.5,0.5], [0.5,-0.5]], [[0.5,-0.5], [0.5,0.5]]], expected: true}, // Same.
    {input: [[[0.5,0.5], [0.5,-0.5]], [[0.5,-1.0], [0.5,0.0]]], expected: true, debug: true}, // Same.
    {input: [[[0.25,0.25], [0.75,0.75]], [[0,0], [1,1]]], expected: true}, // First witin the second.
    {input: [[[0,0], [1,1]], [[0.25,0.25], [0.75,0.75]]], expected: true}, // Second witin the first.
    {input: [[[-1,-1], [1,1]], [[0,0], [2,2]]], expected: true}, // Same line, first then second.
    {input: [[[0,0], [2,2]], [[-1,-1], [1,1]]], expected: true}, // Same line, second then first.
    {input: [[[0,0], [1,1]], [[2,2], [3,3]]], expected: false}, // Same line, space bettween edges.
    {input: [[[0,0], [1,1]], [[0,1], [1,0]]], expected: false}, // Intersecting.
    {input: [[[0,0], [1,1]], [[0,1], [1,2]]], expected: false}, // Parallel, but offset.
    {input: [[[0,0], [2,2]], [[1,0], [1,2]]], expected: false},
    {input: [[[-1.5,-1.5], [-1.5,-0.5]], [[-1.5,-0.5], [-1.5,0.5]]], expected: false}, // Shared vertex, non-coincident.
    {input: [[[-1.5,-1.5], [-1.5, 1.5]], [[-0.5, 0.5], [-0.5, 1.5]]], expected: false},
  ];
  tests.forEach(test => {
    const e0 = new edges.Edge(test.input[0]), e1 = new edges.Edge(test.input[1]);
    t.is(edges.coincident(e0, e1, test.debug), test.expected);
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

test("Can find a perpindicular intersection through an edge and a vertex", t => {
  const tests = [
    {e: [[0,0], [1,1]],   v: [1,0],   expected: [0.5,0.5]},
    {e: [[0,0], [10,10]], v: [10,0],  expected: [5,5]},
    {e: [[0,0], [5,5]],   v: [5,4],   expected: [4.5,4.5]},
    {e: [[-1,-1], [1,1]], v: [-1,1],  expected: [0,0]},
    {e: [[0,0], [1,1]],   v: [2,2],   expected: null},
    {e: [[-2,-1], [2,1]], v: [-1, 2], expected: [0,0]},
    {e: [[0,0], [2,2]],   v: [1,1],   expected: [1,1]},
    {e: [[0,0], [2,2]],   v: [2,2],   expected: null},
    {e: [[0,0], [1,1]],   v: [1,2],   expected: null},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.e), v = new vertex.Vertex(test.v[0], test.v[1]);
    const ve = (test.expected) ? new vertex.Vertex(test.expected[0], test.expected[1]): null;
    t.deepEqual(edges.vertexIntersection(e, v), ve);
  });
});

test("Can compute the shortest distance between an edge and a vertex", t => {
  const tests = [
    {e: [[0,0], [1,1]],   v: [1,0],   expected: Math.sqrt(Math.pow(0.5, 2) * 2)},
    {e: [[0,0], [10,10]], v: [10,0],  expected: Math.sqrt(Math.pow(5, 2) * 2)},
    {e: [[0,0], [5,5]],   v: [5,4],   expected: Math.sqrt(Math.pow(0.5, 2) * 2)},
    {e: [[-1,-1], [1,1]], v: [-1,1],  expected: Math.sqrt(2)},
    {e: [[0,0], [1,1]],   v: [2,2],   expected: Math.sqrt(2)},
    {e: [[-2,-1], [2,1]], v: [-1, 2], expected: Math.sqrt(Math.pow(2, 2) + 1)},
    {e: [[0,0], [2,2]],   v: [1,1],   expected: 0},
    {e: [[0,0], [2,2]],   v: [2,2],   expected: 0},
    {e: [[0,0], [1,1]],   v: [1,2],   expected: 1},
    {e: [[0,0], [0,2]],   v: [1,1],   expected: 1},
    {e: [[0,0], [2,0]],   v: [1,1],   expected: 1},
  ];
  tests.forEach(test => {
    const e = new edges.Edge(test.e), v = new vertex.Vertex(test.v[0], test.v[1]);
    t.is(edges.vertexDistance(e, v), test.expected);
  });
});

test("Can detect if a point is within the bounds of an edge", t => {
  const cases = [
    {edge: [[-1.5,-1.5], [-1.5, 1.5]], vertex: [-0.5, 1.5], expected: false},
    {edge: [[0,0], [2,0]], vertex: [1,1], expected: false},
  ];
  cases.forEach(item => {
    const edge = new edges.Edge(item.edge);
    const v = new vertex.Vertex(item.vertex[0], item.vertex[1]);
    const actual = edges.withinBounds(edge, v);
    t.is(actual, item.expected);
  });
});

test("Can detect if a vertex is on an edge", t => {
  const cases = [
    {e: [[-0.5, 0.0], [ 0.5, 0.0]],   v: [ 0.0, 0.0],   expected: true},
    {e: [[-0.5, 1.0], [ 0.5, 1.0]],   v: [ 0.0, 0.0],   expected: false},
    {
      e: [
        [-0.4999999999999998, 0.8660254037844387],
        [ 0.5000000000000001, 0.8660254037844386]
      ],
      v: [ 0.0, 0.0],
      expected: false
    },
    {
      e: [
        [-0.4999999999999998, 0.8660254037844387],
        [-1.0000000000000000, 1.2246467991473532e-16]
      ],
      v: [-0.5,-0.2886751345948127],
      expected: false,
      debug: false,
    },
    {
      e: [[-0.5, 0.5], [ 0.5, 0.5]],
      v: [-0.5,-0.5],
      expected: false,
      debug: true,
    },
    {
      e: [[-0.5, 0.5], [-0.5, 1.5]],
      v: [-0.5,-0.5],
      expected: false,
      debug: false,
    },
    {
      e: [[-1.5, 1.5], [-0.5, 1.5]],
      v: [-0.5,-0.5],
      expected: false,
      debug: false,
    },
    {
      e: [[-1.5,-1.5], [-1.5, 1.5]],
      v: [-0.5,-0.5],
      expected: false,
      debug: false,
    },
    {
      e: [[-1.5,-1.5], [ 1.5,-1.5]],
      v: [-0.5,-0.5],
      expected: false,
      debug: false,
    },
  ];
  cases.forEach(item => {
    const e = new edges.Edge(item.e), v = new vertex.Vertex(item.v[0], item.v[1]);
    t.is(edges.on(e, v, item.debug), item.expected);
  });
});
