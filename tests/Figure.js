import test from "ava";
import ShapeFactory from "shape-factory";
import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import Shape from "../lib/Shape";
import * as figures from "../lib/Figure";

const ShapeMaker = new ShapeFactory();

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
    const f = new figures.Figure(values);
  });
});

test("Can get the original shape from the figure", t => {
  const cases = [
    {shape: new Shape([[0,0], [0,1], [1,0]])},
    {shape: new Shape([[0,0], [0,1], [1,0]]), position: [10,10]},
  ];
  cases.forEach(item => {
    const f = new figures.Figure(item);
    t.deepEqual(f.shape(), item.shape);
  });
});

test("Can get and set the position of a Figure", t => {
  const testShape = new Shape([[0,0], [0,1], [1,0]]);
  const f = new figures.Figure({shape: testShape});
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
  const f = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
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
  const f = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  cases.forEach(item => {
    const expected = new vertex.Vertex(item.expected[0], item.expected[1]);
    f.rotate(item.input);
    t.true(vertex.same(f.vertices()[1], expected));
  });
});

test("Can reflect a Figure across the x-axis", t => {
  const cases = [
    {
      input: {
        shape: ShapeMaker.make('square'),
      },
      expected: {
        shape: ShapeMaker.make('square'),
      },
    },
    {
      input: {
        shape: ShapeMaker.make('equilateral'),
      },
      expected: {
        shape: ShapeMaker.make('equilateral'),
        rotation: Math.PI,
      },
    },
  ];
  cases.forEach(item => {
    const actual = new figures.Figure(item.input);
    const expected = new figures.Figure(item.expected);
    actual.reflectX();
    t.true(figures.same(actual, expected));
  });
});

test("Can reflect a Figure across the y-axis", t => {
  const cases = [
    {
      input: ShapeMaker.make('square'),
      expected: ShapeMaker.make('square')
    },
    {
      input: ShapeMaker.make('equilateral'),
      expected: ShapeMaker.make('equilateral')
    },
    {
      input: ShapeMaker.make('equilateral').rotate(-Math.PI/2),
      expected: ShapeMaker.make('equilateral').rotate(Math.PI/2)
    },
  ];
  cases.forEach(item => {
    const actual = new figures.Figure({shape: item.input});
    const expected = new figures.Figure({shape: item.expected});
    actual.reflectY();
    t.true(figures.same(actual, expected));
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
  const f = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
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
    const f = new figures.Figure(values.input);
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
    const f = new figures.Figure(values.input);
    const expected = values.expected.map(points => {
      return new edges.Edge(points);
    });
    f.edges().forEach((e, i) => {
      t.true(edges.same(e, expected[i]));
    });
  });
});

test("Can detect if two figures are overlapping", t => {
  const rightTriangle = ShapeMaker.make("right");
  const equilateral = ShapeMaker.make("equilateral");
  const hexagon = ShapeMaker.make("hexagon");
  const diamond = ShapeMaker.make("diamond");

  const figA = {shape: rightTriangle};
  const figB = {shape: rightTriangle, position: [2, 0]};
  const figC = {shape: rightTriangle, position: [2.5, 0]};
  const figD = {shape: equilateral, position: [0,0]};
  const figE = {shape: hexagon, position: [0,0]};

  const cases = [
    {input: [figA, figB], expected: false},
    {input: [figA, figA], expected: true},
    {input: [figB, figC], expected: true},
    {input: [figC, figB], expected: true},
    {input: [figD, figE], expected: true},
    {
      input: [
        {shape: ShapeMaker.make("square", 1)},
        {shape: ShapeMaker.make("square", 3)},
      ],
      expected: true,
    },
    {
      input: [
        {shape: ShapeMaker.arbitrary([
          [-1.5,-1.5],
          [-1.5, 1.5],
          [-0.5, 1.5],
          [-0.5, 0.5],
          [ 0.5, 0.5],
          [ 0.5, 1.5],
          [ 1.5, 1.5],
          [ 1.5,-1.5],
        ])},
        {shape: ShapeMaker.make("square", 1)},
      ],
      expected: true,
      debug: false,
    },
    {
      input: [
        {shape: ShapeMaker.arbitrary([
          [-1.5,-1.5],
          [-1.5, 1.5],
          [-0.5, 1.5],
          [-0.5, 0.5],
          [ 0.5, 0.5],
          [ 0.5, 1.5],
          [ 1.5, 1.5],
          [ 1.5,-1.5],
        ])},
        {shape: ShapeMaker.make("square", 1), position: [0,1]},
      ],
      expected: false,
      debug: false,
    },
    {
      input: [
        {shape: hexagon},
        {
          shape: ShapeMaker.arbitrary([
            [hexagon.vertices()[4].x, hexagon.vertices()[4].y],
            [ 0.0, 0.0],
            [hexagon.vertices()[5].x, hexagon.vertices()[5].y],
          ]),
          position: [0,0]
        },
      ],
      expected: true,
      debug: false,
    },
    {
      input: [
        {shape: diamond},
        {
          shape: ShapeMaker.arbitrary([
            [diamond.vertices()[0].x, diamond.vertices()[0].y],
            [diamond.vertices()[2].x, diamond.vertices()[2].y],
            [diamond.vertices()[3].x, diamond.vertices()[3].y],
          ]),
          position: [0,0]
        },
      ],
      expected: true,
      debug: false,
    },
    {
      input: [
        {shape: ShapeMaker.make("equilateral"), position: [-0.5, 0.2886751345948127]},
        {shape: ShapeMaker.make("equilateral"), position: [ 0.5, 0.2886751345948127]},
      ],
      expected: false,
      debug: false,
    },
  ];
  cases.forEach((item, index) => {
    const first = new figures.Figure(item.input[0]);
    const second = new figures.Figure(item.input[1]);
    const msg = `Fail: Case ${index}`;
    t.is(figures.overlap(first, second, item.debug), item.expected, msg);
  });
});

test("Can detect if two figures have intersecting edges", t => {
  const square = ShapeMaker.make("square");
  const right = ShapeMaker.make("right");

  const cases = [
    {
      figures: [
        {shape: square},
        {shape: square},
      ],
      expected: false,
      should: "return false for a figure within another figure"
    },
    {
      figures: [
        {shape: square},
        {shape: square, rotation: Math.PI/4},
      ],
      expected: true,
      should: "return trur for two figures with an intersecting edges"
    },
  ];
  cases.forEach(item => {
    const first = new figures.Figure(item.figures[0]);
    const second = new figures.Figure(item.figures[1]);
    t.is(
      figures.intersect(first, second),
      item.expected,
      item.should
    )
  });
});

test("Can detect if two figures are siblings", t => {
  const square = ShapeMaker.make("square");
  const cases = [
    {
      figures: [
        {shape: square, position: [0,0]},
        {shape: square, position: [2,0]}
      ],
      expected: false
    },
    {
      figures: [
        {shape: square, position: [0,0]},
        {shape: square, position: [1,0]}
      ],
      expected: true
    },
    {
      figures: [
        {shape: square, position: [0,0]},
        {shape: square, position: [0,-1]}
      ],
      expected: true
    },
  ];
  const createFigure = (options) => new figures.Figure(options);
  cases.forEach(item => {
    const figs = item.figures.map(createFigure);
    t.is(figures.siblings(...figs), item.expected);
  });
});
