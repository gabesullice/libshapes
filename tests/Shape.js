import test from "ava";
import * as vertex from "../src/Vertex";
import { Shape, same, denormalize as denormalizeShape } from "../src/Shape";
import { Edge } from "../src/Edge";
import ShapeFactory from "shape-factory";

// The shape-factory library depends on this library, so it never has the
// latest features that we're trying to test here. However, it _does_ have a
// useful list of premade shapes that we would like to use in these tests.
// We can use those shape definitions and then "upcast" them to the latest
// Shape class.
const ShapeMaker = {
  factory: new ShapeFactory(),
  make(name) {
    return this.upcast(this.factory.make(name));
  },
  arbitrary() {
    return this.upcast(this.factory.arbitrary(...arguments));
  },
  upcast(shape) {
    return new Shape(shape.vertices().map(v => [v.x, v.y]));
  }
}

test("Can instantiate a Shape", t => {
  const rightTriangle = new Shape([[0,0], [1,0], [0,1]]);
  const square = new Shape([[0,0], [1,0], [1,1], [0,1]]);
});

test("Can normalize a Shape", t => {
  const cases = [
    {
      input: ShapeMaker.make("equilateral"),
      expected: {
        type: "shape",
        data: {
          vertices: ShapeMaker.make("equilateral").vertices().map(v => v.normalize()),
        },
      },
    },
  ];
  cases.forEach(item => {
    t.deepEqual(item.input.normalize(), item.expected)
  });
});

test("Can denormalize a Shape", t => {
  const cases = [
    {
      input: {
        type: "shape",
        data: {
          vertices: ShapeMaker.make("equilateral").vertices().map(v => v.normalize()),
        },
      },
      expected: ShapeMaker.make("equilateral"),
    },
  ];
  cases.forEach(item => {
    t.deepEqual(denormalizeShape(item.input), item.expected)
  });
});

test("Can get vertices of a Shape", t => {
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

test("Can get edges of a Shape", t => {
  const input = new Shape([[0,0], [1,0], [0,1]]);
  const expected = [
    new Edge([[0,0], [1,0]]),
    new Edge([[1,0], [0,1]]),
    new Edge([[0,1], [0,0]]),
  ];
  t.deepEqual(input.edges(), expected);
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

test("Can translate a Shape", t => {
  const tests = [
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[0,0], [0,2], [2,0]]), translation: [0,0]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[0,1], [0,3], [2,1]]), translation: [0,1]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[1,0], [1,2], [3,0]]), translation: [1,0]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[1,1], [1,3], [3,1]]), translation: [1,1]},
    {o: new Shape([[0,0], [0,2], [2,0]]), e: new Shape([[-1,-1], [-1,1], [1,-1]]), translation: [-1,-1]},
  ];
  tests.forEach(test => {
    const actual = test.o.translate(test.translation);
    actual.vertices().forEach((v, i) => {
      const vs = test.e.vertices();
      t.true(vertex.same(v, vs[i]));
    });
  });
});

test("Can reflect a Shape across the x-axis", t => {
  const cases = [
    {
      input: ShapeMaker.make('square'),
      expected: ShapeMaker.make('square'),
    },
    {
      input: ShapeMaker.make('equilateral'),
      expected: ShapeMaker.make('equilateral').rotate(Math.PI),
    },
    {
      input: ShapeMaker.make('equilateral').rotate(Math.PI/4),
      expected: ShapeMaker.make('equilateral').rotate(3 * Math.PI/4),
    },
  ];
  cases.forEach(item => {
    const actual = item.input.reflectX();
    t.true(same(actual, item.expected));
  });
});

test("Can reflect a Shape across the y-axis", t => {
  const cases = [
    {
      input: ShapeMaker.make('equilateral'),
      expected: ShapeMaker.make('equilateral'),
    },
    {
      input: ShapeMaker.make('square'),
      expected: ShapeMaker.make('square'),
    },
    {
      input: ShapeMaker.make('equilateral').rotate(Math.PI/2),
      expected: ShapeMaker.make('equilateral').rotate(-Math.PI/2),
    },
  ];
  cases.forEach(item => {
    const actual = item.input.reflectY();
    t.true(same(actual, item.expected));
  });
});
