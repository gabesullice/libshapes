import test from "ava";
import Shape from "../lib/Shape";
import {Edge} from "../lib/Edge";
import * as vertex from "../lib/Vertex";
import * as figures from "../lib/Figure";
import ShapeFactory from "shape-factory";
import Composition from "../lib/Composition";

const ShapeMaker = new ShapeFactory();

test("Can instantiate a new composition", t => {
  const c = new Composition({snap: false});
});

test("Can set the bounds of a composition", t => {
  const cases = [
    {input: undefined, expected: [[0,0], [100,100]]},
    {input: [[0,0], [1000,1000]], expected: [[0,0], [1000,1000]]},
    {input: [[-100,-100], [0,0]], expected: [[-100,-100], [0,0]]},
    {input: [[-100,-100], [100,100]], expected: [[-100,-100], [100,100]]},
    {input: [[100,100], [-100,-100]], expected: [[-100,-100], [100,100]]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    t.deepEqual(c.bounds.apply(c, item.input), item.expected);
  });
});

test("Can add multiple figures to a composition", t => {
  const figure = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: figure, expected: "fig-0"},
    {input: figure, expected: "fig-1"},
  ];
  const c = new Composition({snap: false});
  cases.forEach(item => {
    t.is(c.add(item.input), item.expected);
  });
});

test("Adding a figure to a composition adds its vertices to a vertex tree", t => {
  const fig = new figures.Figure({
    shape: ShapeMaker.make("square"),
    position: [10,10],
  });
  const c = new Composition();
  const fid = c.add(fig);
  fig.vertices().forEach(point => {
    t.truthy(c._vTree.at(point));
  });
});

test("Can get all figures in a composition", t => {
  const figure = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: [], expected: []},
    {input: [figure], expected: ["fig-0"]},
    {input: [figure, figure], expected: ["fig-0", "fig-1"]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(fig => { c.add(fig) });
    t.deepEqual(Object.keys(c.figures()), item.expected);
  });
});

test("Can get a figure in a composition by ID", t => {
  const figureA = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const figureB = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: [figureA],          get: "fig-0", expected: figureA},
    {input: [figureA, figureB], get: "fig-0", expected: figureA},
    {input: [figureA, figureB], get: "fig-1", expected: figureB},
    {input: [figureA, figureB], get: "fig-2", expected: null},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(fig => { c.add(fig) });
    t.deepEqual(c.get(item.get), item.expected);
  });
});

test("Can remove figures in a composition by ID", t => {
  const figure = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: [], remove: [], expected: []},
    {input: [figure], remove: ["fig-0"], expected: []},
    {input: [figure, figure], remove: ["fig-0"], expected: ["fig-1"]},
    {input: [figure, figure], remove: ["fig-2"], expected: ["fig-0", "fig-1"]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(fig => { c.add(fig) });
    item.remove.forEach(id => { c.remove(id) });
    t.deepEqual(Object.keys(c.figures()), item.expected);
  });
});

test("Removing a figure from a composition removes its vertices from the vertex tree", t => {
  const fig = new figures.Figure({
    shape: ShapeMaker.make("square"),
    position: [10,10],
  });
  const c = new Composition();
  const fid = c.add(fig);
  fig.vertices().forEach(point => {
    t.truthy(c._vTree.at(point), "The vertices of the figure are added.");
  });
  c.doLog = true;
  c.remove(fid);
  fig.vertices().forEach(point => {
    t.falsy(c._vTree.at(point), "The vertices of the figure are removed.");
  });
});

test("Can move figures in a composition by ID", t => {
  const figureA = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const figureB = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: [figureA], translation: [0,0], expected: [0,0]},
    {input: [figureA], translation: [1,1], expected: [1,1]},
    {input: [figureA, figureB], translation: [1,1], expected: [1,1]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(fig => { c.add(fig) });
    c.move("fig-0", item.translation);
    t.deepEqual(c.get("fig-0").position(), item.expected);
  });
});

test("Move returns an initial position, target, and final position", t => {
  const rightTriangle = ShapeMaker.make("right");
  const cases = [
    {input: [{shape: rightTriangle}], move: [1,0], expected: {start: [0,0], target: [1,0], final: [1,0], snapped: false}},
    {input: [{shape: rightTriangle}, {shape: rightTriangle, position: [2,0]}], move: [1,0], expected: {start: [0,0], target: [1,0], final: [1,0], snapped: false}},
    {input: [{shape: rightTriangle}, {shape: rightTriangle, position: [2,0]}], move: [.99,0], expected: {start: [0,0], target: [.99,0], final: [1,0], snapped: true}},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: true, snapTolerance: 0.002});
    item.input.forEach(value => {
      c.add(new figures.Figure(value));
    });
    const result = c.move("fig-0", item.move);
    t.deepEqual(result, item.expected);
  });
});

test("Moving a figures updates its vertices in the VertexTree", t => {
  const square = ShapeMaker.make("square");
  const cases = [
    {figure: {shape: square}, move: [10,10], subtests: [
      {query: [0.5,0.5], expect: 'undefined'},
      {query: [9.5,9.5], expect: 'object'},
    ]},
  ];
  cases.forEach(item => {
    const c = new Composition();
    const fid = c.add(new figures.Figure(item.figure));
    c.move(fid, item.move);
    item.subtests.forEach(sub => {
      t.is(
        typeof(c._vTree.at(new vertex.Vertex(sub.query[0], sub.query[1]))),
        sub.expect
      );
    });
  });
});

test("Can set the snap tolerance of a Composition", t => {
  const cases = [
    {input: undefined, expected: .001},
    {input: .001, expected: .001},
    {input: .002, expected: .002},
  ];
  cases.forEach(item => {
    const c = new Composition();
    t.is(c.snapTolerance(item.input), item.expected);
  });
});

test("Can find overlapping figures", t => {
  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
  const posA = [0,0];
  const posB = [2, 0];
  const posC = [2.5, 0];
  const posD = [2.75, 0];
  const cases = [
    {input: [], expected: []},
    {input: [posA], expected: []},
    {input: [posA, posB], expected: []},
    {input: [posB, posC], expected: [{a: "fig-0", b: "fig-1"}]},
    {input: [posA, posB, posC], expected: [{a: "fig-1", b: "fig-2"}]},
    {input: [posA, posB, posC, posD], expected: [{a: "fig-1", b: "fig-2"}, {a: "fig-1", b: "fig-3"}, {a: "fig-2", b: "fig-3"}]},
    {input: [posA, posB, posC, posD], remove: "fig-2", expected: [{a: "fig-1", b: "fig-3"}]},
    {input: [posB, posC], move: {fid: "fig-0", pos: [10,0]}, expected: []},
    {input: [posA, posB], move: {fid: "fig-0", pos: [1.5,0]}, expected: [{a: "fig-1", b: "fig-0"}]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(pos => {
      c.add(new figures.Figure({shape: rightTriangle, position: pos}))
    });
    if (item.remove) c.remove(item.remove);
    if (item.move) {
      c.move(item.move.fid, item.move.pos);
    }
    t.deepEqual(c.overlapping(), item.expected);
  });

});

//test("Can find overlapping figures efficiently", t => {
//  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
//  const fig = new figures.Figure({shape: rightTriangle});
//  const cases = [
//    {shape: fig, copies: 10, allowed: 100},
//    {shape: fig, copies: 20, allowed: 100},
//    {shape: fig, copies: 40, allowed: 100},
//    {shape: fig, copies: 100, allowed: 300},
//    {shape: fig, copies: 500, allowed: 750},
//  ];
//  cases.forEach(item => {
//    const start = process.hrtime()[1];
//    const c = new Composition();
//    for (var i = 0; i < item.copies; i++) {
//      item.shape.position([Math.random(), Math.random()]);
//      c.add(item.shape);
//    }
//    c.overlapping();
//    const dur = (process.hrtime()[1] - start) / 1e+6; // nano to milliseconds
//    t.true(dur < item.allowed);
//  });
//});

test("Will snap a moved figure in a composition to another figure", t => {
  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
  const square = new Shape([[0,0], [0,1], [1,1], [1,0]]);
  const figureA = new figures.Figure({shape: square, position: [0,0]});
  const figureB = new figures.Figure({shape: square, position: [2,2]});
  const bound = 100, toleranceSetting = .001, tolerance = bound * toleranceSetting;
  const cases = [
    {input: [figureA, figureB], translation: [0,0], expected: [0,0]},
    {input: [figureA, figureB], translation: [1,1], expected: [1,1]},
    {input: [figureA, figureB], translation: [1,1 + tolerance], expected: [1,1]},
    {input: [figureA, figureB], translation: [1,1 - tolerance], expected: [1,1]},
    {input: [figureA, figureB], translation: [1,1 + tolerance], expected: [1,1]},
    {input: [figureA, figureB], translation: [1 - tolerance,1], expected: [1,1]},
    {input: [figureA, figureB], translation: [1 - tolerance,2], expected: [1,2]},
    {input: [figureA, figureB], translation: [1 - tolerance,3], expected: [1,3]},
    {input: [figureA, figureB], translation: [1 - tolerance,3], expected: [1,3]},
    {input: [figureA, figureB], translation: [2,3 + tolerance], expected: [2,3]},
    {input: [figureA, figureB], translation: [2 + tolerance/2,3 + tolerance/2], expected: [2,3]},
    {input: [figureA, figureB], translation: [2 + tolerance/2,3 + tolerance/2], expected: [2,3]},
    {input: [figureA, figureB], translation: [1,1 + tolerance * 2], expected: [1,1 + tolerance * 2]},
    {input: [figureA, figureB], translation: [1,1 - tolerance * 2], expected: [1,1 - tolerance * 2]},
    {input: [figureA, figureB], translation: [1 + tolerance * 2,1], expected: [1 + tolerance * 2,1]},
    {input: [figureA, figureB], translation: [1 - tolerance * 2,1], expected: [1 - tolerance * 2,1]},
    {input: [figureA, figureB], translation: [1 + tolerance * 2,1 + tolerance * 2], expected: [1 + tolerance * 2,1 + tolerance * 2]},
    {input: [figureA, figureB], translation: [1 - tolerance * 2,1 - tolerance * 2], expected: [1 - tolerance * 2,1 - tolerance * 2]},
  ];
  cases.forEach(item => {
    const c = new Composition();
    c.bounds([0,0], [bound,bound]);
    c.snapTolerance(toleranceSetting)
    item.input.forEach(fig => { c.add(fig) });
    c.move("fig-0", item.translation, true);
    const pos = c.get("fig-0").position();
    const actual = new vertex.Vertex(pos[0], pos[1]);
    const expected = new vertex.Vertex(item.expected[0], item.expected[1]);
    t.true(vertex.same(actual, expected));
  });
});

test("Adding a figure to a composition inserts subsected edges in a vtree", t => {
  const c = new Composition();
  const square = ShapeMaker.make("square");
  const largeSquare = ShapeMaker.make("square", 3);
  c.add(new figures.Figure({shape: largeSquare}));
  c.add(new figures.Figure({shape: square, position: [-1,0]}));
  const item = c._subsectTree.at(new vertex.Vertex(-1.5, 0.5));
  t.truthy(item, "Should find an item at (-1.5, 0.5)");
  t.is(item.edges.length, 2, "Should have two edges eminating from the vertex.");
  t.deepEqual(item.edges[0], new Edge([[-1.5,-0.5], [-1.5, 0.5]]));
  t.deepEqual(item.edges[1], new Edge([[-1.5,0.5], [-1.5, 1.5]]));
});

test("Removing a figure from a composition removes subsected edges in a vtree", t => {
  const c = new Composition();
  const square = ShapeMaker.make("square");
  const largeSquare = ShapeMaker.make("square", 3);
  const lid = c.add(new figures.Figure({shape: largeSquare}));
  // just add and remove a figure to be sure that the sections are cleaned up.
  c.remove(c.add(new figures.Figure({shape: square, position: [-1,0]})));
  t.falsy(c._subsectTree.at(new vertex.Vertex(-1.5, 0.5)), "Should NOT find an item at (-1.5, 0.5)");
  // Add the small square back in.
  c.add(new figures.Figure({shape: square, position: [-1,0]}));
  // Remove the large sqaure.
  c.remove(lid);
  // This should also remove the subsections created by adding the small square.
  t.falsy(c._subsectTree.at(new vertex.Vertex(-1.5, 0.5)), "Should NOT find an item at (-1.5, 0.5)");
});

//test("Can snap figures to one another efficiently", t => {
//  const square = new Shape([[0,0], [0,1], [1,1], [1,0]]);
//  const maxAllowedMs = 50; // milliseconds
//  const c = new Composition();
//  for (var i = 0; i < 100; i++) {
//    const start = process.hrtime()[1];
//    const fig = new figures.Figure({shape: square, position: [Math.random() * 100, Math.random() * 100]});
//    c.add(fig);
//    const dur = (process.hrtime()[1] - start) / 1e+6; // nano to milliseconds
//    t.true(dur < maxAllowedMs);
//  }
//});
//
//test("Can find gaps in the composition", t => {
//  const square = ShapeMaker.make("square")
//  const largeSquare = ShapeMaker.make("square", 3)
//  const cases = [
//    {input: [
//      {shape: largeSquare},
//      {shape: square, position: [-1,-1]},
//      {shape: square, position: [-1,0]},
//      {shape: square, position: [-1,1]},
//      {shape: square, position: [0,1]},
//      {shape: square, position: [1,1]},
//      {shape: square, position: [1,0]},
//      {shape: square, position: [1,-1]},
//      {shape: square, position: [0,-1]},
//    ], expected: [[-0.5,-0.5], [-0.5,0.5], [0.5,0.5], [0.5,-0.5]]},
//  ];
//  cases.forEach(item => {
//    const c = new Composition();
//    item.input.forEach(options => {
//      c.add(new figures.Figure(options))
//    })
//    t.deepEqual(c.gaps(), [new figures.Figure({shape: square})]);
//  });
//});
