import test from "ava";
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
  const figure = new figures.Figure({shape: ShapeMaker.make("right")});
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
  const figure = new figures.Figure({shape: ShapeMaker.make("right")});
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
  const right = ShapeMaker.make("right");
  const figureA = new figures.Figure({shape: right});
  const figureB = new figures.Figure({shape: right});
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
  const figure = new figures.Figure({shape: ShapeMaker.make("right")});
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
  c.remove(fid);
  fig.vertices().forEach(point => {
    t.falsy(c._vTree.at(point), "The vertices of the figure are removed.");
  });
});

test("Can set the position of figures in a composition by ID", t => {
  const figureA = new figures.Figure({shape: ShapeMaker.make("right")});
  const figureB = new figures.Figure({shape: ShapeMaker.make("right")});
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

test("Can set the rotation figures in a composition by ID", t => {
  const figureA = new figures.Figure({shape: ShapeMaker.make("right")});
  const figureB = new figures.Figure({shape: ShapeMaker.make("right")});
  const cases = [
    {input: [figureA], rotation: Math.PI/2, expected: Math.PI/2},
    {input: [figureA], rotation: Math.PI/4, expected: Math.PI/4},
    {input: [figureA, figureB], rotation: Math.PI, expected: Math.PI},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(fig => { c.add(fig) });
    c.rotateTo("fig-0", item.rotation);
    t.deepEqual(c.get("fig-0").rotation(), item.expected);
  });
});

test("Move returns an initial position, target, and final position", t => {
  const right = ShapeMaker.make("right");
  const cases = [
    {input: [{shape: right}], move: [1,0], expected: {start: [0,0], target: [1,0], final: [1,0], snapped: false}},
    {input: [{shape: right}, {shape: right, position: [2,0]}], move: [1,0], expected: {start: [0,0], target: [1,0], final: [1,0], snapped: false}},
    {input: [{shape: right}, {shape: right, position: [2,0]}], move: [.99,0], expected: {start: [0,0], target: [.99,0], final: [1,0], snapped: true}},
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
  const right = ShapeMaker.make("right");
  const posA = [0,0];
  const posB = [2, 0];
  const posC = [2.5, 0];
  const posD = [2.75, 0];
  const cases = [
    {input: [], expected: []},
    {input: [posA], expected: []},
    {input: [posA, posB], expected: []},
    {input: [posB, posC], expected: [{a: "fig-1", b: "fig-0"}]},
    {input: [posA, posB, posC], expected: [{a: "fig-2", b: "fig-1"}]},
    {input: [posA, posB, posC, posD], expected: [{a: "fig-2", b: "fig-1"}, {a: "fig-3", b: "fig-1"}, {a: "fig-3", b: "fig-2"}]},
    {input: [posA, posB, posC, posD], remove: "fig-2", expected: [{a: "fig-3", b: "fig-1"}]},
    {input: [posB, posC], move: {fid: "fig-0", pos: [10,0]}, expected: []},
    {input: [posA, posB], move: {fid: "fig-0", pos: [1.5,0]}, expected: [{a: "fig-0", b: "fig-1"}]},
  ];
  cases.forEach(item => {
    const c = new Composition({snap: false});
    item.input.forEach(pos => {
      c.add(new figures.Figure({shape: right, position: pos}))
    });
    if (item.remove) c.remove(item.remove);
    if (item.move) {
      c.move(item.move.fid, item.move.pos);
    }
    t.deepEqual(c.overlapping(), item.expected);
  });

});

test.skip("Can find overlapping figures efficiently", t => {
  const right = ShapeMaker.make("right");
  const fig = new figures.Figure({shape: right});
  const randomPosition = function () {
    return [Math.random() * 100, Math.random() * 100];
  };
  const cases = [
    {shape: fig, copies: 10, allowed: 100},
    {shape: fig, copies: 20, allowed: 100},
    {shape: fig, copies: 40, allowed: 100},
    {shape: fig, copies: 100, allowed: 300},
    {shape: fig, copies: 500, allowed: 750},
  ];
  cases.forEach(item => {
    const start = process.hrtime();
    const c = new Composition();
    for (var i = 0; i < item.copies; i++) {
      item.shape.position(randomPosition());
      c.add(item.shape);
    }
    c.overlapping();
    const dur = process.hrtime(start)[1] / 1e+6; // nano to milliseconds
    t.true(dur < item.allowed);
  });
});

test("Will snap a moved figure in a composition to another figure", t => {
  let right = ShapeMaker.make("right");
  right = right.translate([right.vertices()[0].x * -1, right.vertices()[0].x * -1]);
  let square = ShapeMaker.make("square");
  square = square.translate([square.vertices()[0].x * -1, square.vertices()[0].x * -1]);
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

test.skip("Can snap figures to one another efficiently", t => {
  const square = ShapeMaker.make("square");
  const maxAllowedMs = 50; // milliseconds
  const randomFigure = function () {
    return new figures.Figure({
      shape: square,
      position: [Math.random() * 100, Math.random() * 100]
    });
  };

  const c = new Composition();
  c.add(randomFigure());

  for (var i = 0; i < 1000; i++) {
    const fig = randomFigure();
    const start = process.hrtime();
    c._calculateSnap(fig);
    const dur = process.hrtime(start)[1] / 1e+6; // nano to milliseconds
    c.add(fig);
    t.true(dur < maxAllowedMs);
  }
});

test("Can find gaps in the composition", t => {
  const square = ShapeMaker.make("square")
  const right = ShapeMaker.make("right")
  const parallelogram = ShapeMaker.make("parallelogram")
  const largeSquare = ShapeMaker.make("square", 3)
  const cases = [
    {
      figures: [
        {shape: ShapeMaker.make("square")},
        {
          shape: right,
          position: [
            -1 * right.vertices()[0].x - 0.5,
            -1 * right.vertices()[0].y - 0.75,
          ],
        },
      ],
      doLog: true,
      subtests: [],
      description: "Ignores intersecting figures",
    },
    {
      figures: [{shape: largeSquare}, {shape: square, position: [5,0]}],
      subtests: [],
      description: "Finds no gaps when no figures overlap",
    },
    {
      figures: [{shape: largeSquare}, {shape: square, position: [0,1]}],
      subtests: [
        {
          vertices: [
            [-0.5, 1.5],
            [-0.5, 0.5],
            [ 0.5, 0.5],
            [ 0.5, 1.5],
            [ 1.5, 1.5],
            [ 1.5,-1.5],
            [-1.5,-1.5],
            [-1.5, 1.5],
          ],
        },
      ],
      description: "Small square within a large square",
    },
    {
      figures: [
        {shape: largeSquare},
        {shape: square, position: [0,1]},
        {shape: square, position: [1,1]}
      ],
      subtests: [
        {
          vertices: [
            [ 0.5, 0.5],
            [ 1.5, 0.5],
            [ 1.5,-1.5],
            [-1.5,-1.5],
            [-1.5, 1.5],
            [-0.5, 1.5],
            [-0.5, 0.5],
          ],
        },
      ],
      description: "Old gaps are removed when a figure is placed on it",
    },
    {
      figures: [
        {shape: largeSquare},
        {shape: square, position: [1,1]},
        {shape: square, position: [0,0]}
      ],
      subtests: [
        {
          vertices: [
            [-0.5, 0.5],
            [-0.5,-0.5],
            [ 0.5,-0.5],
            [ 0.5, 0.5],
            [ 1.5, 0.5],
            [ 1.5,-1.5],
            [-1.5,-1.5],
            [-1.5, 1.5],
            [ 0.5, 1.5],
            [ 0.5, 0.5],
          ],
        },
      ],
      description: "Gaps are found with an middle intersection",
      debug: false,
    },
  ];

  cases.forEach(item => {
    const c = new Composition({processGaps: true, snap: false, debug: false});
    c.debug(item.debug);
    item.figures.forEach((options, i) => {
      c.add(new figures.Figure(options))
    })

    const toPoints = function (figureList) {
      return figureList.map(gap => {
        return gap.vertices().map(v => {
          return [v.x, v.y];
        });
      });
    };

    const actual = toPoints(c.gaps());
    const figs = item.subtests.map(sub => {
      return new figures.Figure({shape: ShapeMaker.arbitrary(sub.vertices)});
    });
    const expected = toPoints(figs);
    t.deepEqual(actual, expected, item.description);
  });
});

test("A gap is created when a figure is removed", t => {
  const square = ShapeMaker.make("square");
  const largeSquare = ShapeMaker.make("square", 3)
  const cases = [
    {
      figures: [
        {shape: largeSquare},
        {shape: square, position: [ 1, 1]},
        {shape: square, position: [ 1, 0]},
        {shape: square, position: [ 1,-1]},
        {shape: square, position: [ 0,-1]},
        {shape: square, position: [-1,-1]},
        {shape: square, position: [-1, 0]},
        {shape: square, position: [-1, 1]},
        {shape: square, position: [ 0, 1]},
        {shape: square, position: [ 0, 0]},
      ],
      subtests: [
        {
          remove: "fig-9",
          expected: {shape: square, position: [ 0, 0]},
          debug: false,
        },
      ],
    },
    {
      figures: [
        {shape: largeSquare},
        {shape: square, position: [ 0, 1]},
        {shape: square, position: [ 1, 1]},
      ],
      subtests: [
        {
          remove: "fig-1",
          expected: {shape: ShapeMaker.arbitrary([
            [ 0.5, 1.5],
            [ 0.5, 0.5],
            [ 1.5, 0.5],
            [ 1.5,-1.5],
            [-1.5,-1.5],
            [-1.5, 1.5],
          ])},
        },
      ],
    },
  ];

  cases.forEach(item => {
    item.subtests.forEach(sub => {
      const c = new Composition({processGaps: true, debug: false});
      c.debug(sub.debug);

      item.figures.map(settings => new figures.Figure(settings)).forEach((fig, i) => {
        const fid = c.add(fig);
      });

      c.remove(sub.remove);

      const expected = new figures.Figure(sub.expected);
      const gaps = c.gaps();
      t.is(gaps.length, 1);
      t.true(figures.same(expected, gaps[0]));
    });
  });
});

test("Can find gaps in a composition (integrated)", t => {
  const square = ShapeMaker.make("square")
  const cases = [
    {
      figures: [
        {
          shape: ShapeMaker.arbitrary([
            [-0.5,-1.5],
            [-0.5, 1.5],
            [ 0.5, 1.5],
            [ 0.5,-1.5],
          ]),
          position: [0, 0]
        },
      ],
      subtests: [
        {
          add: [
            {shape: square, position: [0, 0]},
          ],
          gaps: [
            {shape: square, position: [0, 1]},
            {shape: square, position: [0,-1]},
          ],
          debug: false,
        },
      ],
      description: "Gaps are found when a shape splits an existing gap",
    },
  ];

  cases.forEach(item => {
    item.subtests.forEach(sub => {
      const c = new Composition({
        processGaps: true,
        snap: false,
        debug: sub.debug
      });

      const make = shape => new figures.Figure(shape);

      const original = item.figures.map(make);
      const additonal = sub.add.map(make);
      const expected = sub.gaps.map(make);

      original.forEach(fig => c.add(fig));
      //if (sub.debug) console.log(c.gaps().map(res => res.vertices()));
      additonal.forEach(fig => c.add(fig));
      //if (sub.debug) console.log(c.gaps().map(res => res.vertices()));

      const result = c.gaps();
      //if (sub.debug) console.log(result.map(res => res.vertices()));
      t.is(result.length, expected.length);
      for (let i = 0; i < expected.length; i++) {
        const res = figures.same(result[i], expected[i]);
        if (!res) {
          //console.log(i);
          //console.log(result[i].vertices());
          //console.log(expected[i].vertices());
          figures.same(result[i], expected[i], true);
        }
        t.true(res);
      }
    });
  });
});

test("Gaps are reprocessed when a figure is moved", t => {
  const square = ShapeMaker.make("square")
  const largeSquare = ShapeMaker.make("square", 3)
  const cases = [
    {
      figures: [{shape: largeSquare}, {shape: square, position: [0,1]}],
      subtests: [
        {
          move: {
            id: "fig-1",
            position: [1,1],
          },
          expected: [
            [ 0.5, 1.5],
            [ 0.5, 0.5],
            [ 1.5, 0.5],
            [ 1.5,-1.5],
            [-1.5,-1.5],
            [-1.5, 1.5],
          ],
          debug: false,
        },
      ],
    },
  ];

  cases.forEach(item => {
    const c = new Composition({processGaps: true, snap: false});
    item.figures.forEach((options, i) => {
      c.add(new figures.Figure(options))
    })

    const toPoints = function (figureList) {
      return figureList.map(gap => {
        return gap.vertices().map(v => {
          return [v.x, v.y];
        });
      });
    };

    item.subtests.forEach(sub => {
      c.debug(sub.debug)
      c.move(sub.move.id, sub.move.position);
      const gap = new figures.Figure({shape: ShapeMaker.arbitrary(sub.expected)});
      const expected = toPoints([gap]);
      const actual = toPoints(c.gaps());
      t.deepEqual(actual, expected);
    });
  });
});
