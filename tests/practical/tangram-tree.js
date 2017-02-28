import test from "ava";
import ShapeFactory from "shape-factory";
import Composition from "../../lib/Composition";
import * as figure from "../../lib/Figure";
import * as edges from "../../lib/Edge";

const puzzle = [
  [
    {
      x: 10.710786437626904,
      y: 7.044119770960239
    },
    {
      x: 12.125,
      y: 5.629906208587143
    },
    {
      x: 13.539213562373096,
      y: 7.044119770960238
    },
    {
      x: 13.125,
      y: 7.044119770960238
    },
    {
      x: 14.125,
      y: 8.044119770960238
    },
    {
      x: 13.125,
      y: 8.044119770960238
    },
    {
      x: 13.539213562373096,
      y: 8.458333333333334
    },
    {
      x: 12.625,
      y: 8.458333333333334
    },
    {
      x: 12.625,
      y: 9.458333333333334
    },
    {
      x: 11.625,
      y: 9.458333333333334
    },
    {
      x: 11.625,
      y: 8.458333333333334
    },
    {
      x: 10.710786437626904,
      y: 8.458333333333334
    },
    {
      x: 11.125,
      y: 8.044119770960238
    },
    {
      x: 10.125,
      y: 8.044119770960238
    },
    {
      x: 11.125,
      y: 7.044119770960238
    }
  ],
  [
    {
      x: 12.125,
      y: 4.629906208587143
    },
    {
      x: 11.125,
      y: 5.629906208587143
    },
    {
      x: 13.125,
      y: 5.629906208587143
    }
  ]
];

const solution = [
  [
    {
      "x": 12.125,
      "y": 7.044119770960239
    },
    {
      "x": 10.710786437626904,
      "y": 8.458333333333334
    },
    {
      "x": 13.539213562373096,
      "y": 8.458333333333334
    }
  ],
  [
    {
      "x": 12.625,
      "y": 8.458333333333334
    },
    {
      "x": 11.625,
      "y": 8.458333333333334
    },
    {
      "x": 11.625,
      "y": 9.458333333333334
    },
    {
      "x": 12.625,
      "y": 9.458333333333334
    }
  ],
  [
    {
      "x": 12.125,
      "y": 4.629906208587143
    },
    {
      "x": 11.125,
      "y": 5.629906208587143
    },
    {
      "x": 13.125,
      "y": 5.629906208587143
    }
  ],
  [
    {
      "x": 13.125,
      "y": 7.044119770960238
    },
    {
      "x": 12.125,
      "y": 7.044119770960238
    },
    {
      "x": 13.125,
      "y": 8.044119770960238
    },
    {
      "x": 14.125,
      "y": 8.044119770960238
    }
  ],
  [
    {
      "x": 12.125,
      "y": 5.629906208587143
    },
    {
      "x": 10.710786437626904,
      "y": 7.044119770960239
    },
    {
      "x": 13.539213562373096,
      "y": 7.044119770960238
    }
  ],
  [
    {
      "x": 11.125,
      "y": 7.044119770960238
    },
    {
      "x": 12.125,
      "y": 7.044119770960238
    },
    {
      "x": 11.125,
      "y": 8.044119770960238
    },
    {
      "x": 10.125,
      "y": 8.044119770960238
    }
  ]
];

test("Should properly validate the tangram tree", t => {
  const ShapeMaker = new ShapeFactory();
  const C = new Composition({snap: false, debug: true});
  const toFigures = (item) => {
    const points = item.map(coord => [coord.x, coord.y]);
    const shape = ShapeMaker.arbitrary(points);
    return new figure.Figure({shape});
  };
  const puzzleFigures = puzzle.map(toFigures);
  const solutionFigures = solution.map(toFigures);
  puzzleFigures.forEach(fig => {
    C.add(fig);
  });
  solutionFigures.forEach(fig => {
    C.add(fig);
  });
  const base = C.get("fig-0");
  //console.log(base.vertices().map(v => `${v.x}, ${v.y}`))
  const nonCoincident = (item) => {
    return item.edges.some(e0 => {
      const areCoincident = e1 => edges.coincident(e0, e1);
      const left = C._subsectTree.at(e0.left());
      const right = C._subsectTree.at(e0.right());
      //console.log(e0);
      //console.log(left.edges);
      //console.log(right.edges.length);
      return (
        (left === undefined || !left.edges.some(areCoincident)) ||
        (right === undefined || !right.edges.some(areCoincident))
      );
    });
  };
  console.log(nonCoincident({id: "fig-0", edges: base.edges()}));
});
