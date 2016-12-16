import test from "ava";
import Shape from "../lib/Shape";
import * as vertex from "../lib/Vertex";
import * as figures from "../lib/Figure";
import ShapeFactory from "../../shapelibrary/lib/ShapeFactory.js";
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

test("Can find overlapping figures efficiently", t => {
  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
  const fig = new figures.Figure({shape: rightTriangle});
  const cases = [
    {shape: fig, copies: 10, allowed: 100},
    {shape: fig, copies: 20, allowed: 100},
    {shape: fig, copies: 40, allowed: 100},
    {shape: fig, copies: 100, allowed: 300},
    {shape: fig, copies: 500, allowed: 750},
  ];
  cases.forEach(item => {
    const start = process.hrtime()[1];
    const c = new Composition();
    for (var i = 0; i < item.copies; i++) {
      item.shape.position([Math.random(), Math.random()]);
      c.add(item.shape);
    }
    c.overlapping();
    const dur = (process.hrtime()[1] - start) / 1e+6; // nano to milliseconds
    t.true(dur < item.allowed);
  });
});

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
//  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
//  const figA = new figures.Figure({shape: rightTriangle});
//  const figB = new figures.Figure({shape: rightTriangle, position: [2,0]});
//  const cases = [
//    {input: [figA], expected: ["fig-0"]},
//    {input: [figA, figA], expected: []},
//    {input: [figA, figB], expected: ["fig-0", "fig-1"]},
//  ];
//  cases.forEach(item => {
//    const c = new Composition();
//    item.input.forEach(fig => {
//      c.add(fig)
//    })
//    t.deepEqual(c.gaps(), item.expected);
//  });
//});
