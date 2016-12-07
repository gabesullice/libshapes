import test from "ava";
import Shape from "../lib/Shape";
import * as figures from "../lib/Figure";
import Composition from "../lib/Composition";

test("Can instantiate a new composition", t => {
  const c = new Composition();
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
    const c = new Composition();
    t.deepEqual(c.bounds.apply(c, item.input), item.expected);
  });
});

test("Can add multiple figures to a composition", t => {
  const figure = new figures.Figure({shape: new Shape([[0,0], [0,1], [1,0]])});
  const cases = [
    {input: figure, expected: "fig-0"},
    {input: figure, expected: "fig-1"},
  ];
  const c = new Composition();
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
    const c = new Composition();
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
    const c = new Composition();
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
    const c = new Composition();
    item.input.forEach(fig => { c.add(fig) });
    item.remove.forEach(id => { c.remove(id) });
    t.deepEqual(Object.keys(c.figures()), item.expected);
  });
});

test("Can find overlapping figures", t => {
  const rightTriangle = new Shape([[0,0], [0,1], [1,0]]);
  const figA = new figures.Figure({shape: rightTriangle});
  const figB = new figures.Figure({shape: rightTriangle, position: [2, 0]});
  const figC = new figures.Figure({shape: rightTriangle, position: [2.5, 0]});
  const cases = [
    {input: [], expected: []},
    {input: [figA], expected: []},
    {input: [figA, figB], expected: []},
    {input: [figA, figB, figC], expected: ["fig-1", "fig-2"]},
  ];
  cases.forEach(item => {
    const c = new Composition();
    item.input.forEach(fig => { c.add(fig) });
    t.deepEqual(c.overlapping(), item.expected);
  });
});
