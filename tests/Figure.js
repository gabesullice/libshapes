import test from "ava";
import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import Shape from "../lib/Shape";
import Figure from "../lib/Figure";

test("Can create a new Figure", t => {
  const tests = [
    {
      shape: new Shape([[0,0], [0,1], [1,0]]),
    },
    {
      shape: new Shape([[0,0], [0,1], [1,0]]),
      position: [0,0],
      rotation: 0,
    },
  ];
  tests.forEach(values => {
    const f = new Figure(values);
  });
});

test("Can get and set the position of a Figure", t => {
  const testShape = new Shape([[0,0], [0,1], [1,0]]);
  const f = new Figure({shape: testShape});
  t.deepEqual(f.position(), [0,0]);
  t.deepEqual(f.position([1,1]), [1,1]);
  t.deepEqual(f.position([-1,-1]), [-1,-1]);
});

test("Can translate the position of a Figure", t => {
  const cases = [
    {input: [0,0],   expected: [0,0]},
    {input: [0,1],   expected: [0,1]},
    {input: [1,0],   expected: [1,1]},
    {input: [1,1],   expected: [2,2]},
    {input: [0,-1],  expected: [2,1]},
    {input: [-1,0],  expected: [1,1]},
    {input: [-1,-1], expected: [0,0]},
  ];
  const f = new Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  cases.forEach(item => {
    t.deepEqual(f.translate(item.input), item.expected);
  });
});

test("Can rotate a Figure", t => {
  const cases = [
    // tracks the corner of a triangle about the origin
    {input: Math.PI/2,  expected: [-1,0]},
    {input: Math.PI/2,  expected: [0,-1]},
    {input: Math.PI,    expected: [0,1]},
    {input: Math.PI/2,  expected: [-1,0]},
    {input: Math.PI,    expected: [1,0]},
  ];
  const f = new Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  cases.forEach(item => {
    const expected = new vertex.Vertex(item.expected[0], item.expected[1]);
    f.rotate(item.input);
    t.true(vertex.same(f.vertices()[1], expected));
  });
});

test("Can get and set the rotation of a Figure", t => {
  t.is(Math.PI/2 + Math.PI/2, Math.PI);
  const cases = [
    // tracks the corner of a triangle about the origin
    {input: undefined,      expected: [1,0]},
    {input: Math.PI/2,      expected: [0,1]},
    {input: Math.PI,        expected: [-1,0]},
    {input: 3 * Math.PI/2,  expected: [0,-1]},
    {input: 2 * Math.PI,    expected: [1,0]},
  ];
  const f = new Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  cases.forEach(item => {
    const expected = new vertex.Vertex(item.expected[0], item.expected[1]);
    f.rotation(item.input);
    t.true(vertex.same(f.vertices()[2], expected));
  });
});

test("Can get the computed vertices of a figure", t => {
  const tests = [
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
      },
      expected: [[0,0], [0,1], [1,0]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        position: [1,1]
      },
      expected: [[1,1], [1,2], [2,1]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        rotation: Math.PI/2
      },
      expected: [[0,0], [-1,0], [0,1]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        position: [1,1],
        rotation: Math.PI/2
      },
      expected: [[1,1], [0,1], [1,2]]
    },
  ];
  tests.forEach(values => {
    const f = new Figure(values.input);
    const expected = values.expected.map(points => {
      return new vertex.Vertex(points[0], points[1]);
    });
    f.vertices().forEach((v, i) => {
      t.true(vertex.same(v, expected[i]));
    });
  });
});

test("Get the computed edges of a figure", t => {
  const tests = [
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
      },
      expected: [[[0,0], [0,1]], [[0,1], [1,0]], [[1,0], [0,0]]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        position: [1,1]
      },
      expected: [[[1,1], [1,2]], [[1,2], [2,1]], [[2,1], [1,1]]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        rotation: Math.PI/2
      },
      expected: [[[0,0], [-1,0]], [[-1,0], [0,1]], [[0,1], [0,0]]]
    },
    {
      input: {
        shape: new Shape([[0,0], [0,1], [1,0]]),
        position: [1,1],
        rotation: Math.PI/2
      },
      expected: [[[1,1], [0,1]], [[0,1], [1,2]], [[1,2], [1,1]]]
    },
  ];
  tests.forEach(values => {
    const f = new Figure(values.input);
    const expected = values.expected.map(points => {
      return new edges.Edge(points);
    });
    f.edges().forEach((e, i) => {
      t.true(edges.same(e, expected[i]));
    });
  });
});
