import * as vertex from "./Vertex";
import * as edges from "./Edge";

export class Figure {

  constructor(values) {
    this._shape = values.shape;
    this._position = values.position === undefined ? [0,0] : values.position;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this._compute()
  }

  shape() {
    return this._shape;
  }

  vertices() {
    return this._computed.vertices();
  }

  edges() {
    return this._computed.edges();
  }

  innerEdges() {
    const vs = this.vertices();
    const inner = [];
    for (let i = 0; i < vs.length - 1; i++) {
      for (let j = i + 1; j < vs.length; j++) {
        const first = vs[i], second = vs[j];
        inner.push(new edges.Edge([[first.x, first.y], [second.x, second.y]]));
      }
    }
    return inner;
  }

  position(pos) {
    if (pos !== undefined) {
      this._position = pos;
      this._compute();
    }
    return this._position;
  }

  translate(offset) {
    return this.position([
      this._position[0] + offset[0], this._position[1] + offset[1]
    ]);
  }

  rotation(angle) {
    if (angle !== undefined) {
      this._rotation = angle;
      this._compute();
    }
    return this._rotation;
  }

  rotate(angle) {
    return this.rotation((this._rotation + angle) % (2 * Math.PI));
  }

  _compute() {
    this._computed =
      this._shape
      .rotate(this._rotation)
      .translate(this._position);
    this._bound = getBounds(this.vertices());
  }

}

export function subsect(f0, f1) {
  const e0s = f0.edges(), e1s = f1.edges();
  let subsections = [];
  e0s.forEach(e0 => {
    e1s.forEach(e1 => {
      if (edges.coincident(e0, e1)) {
        subsections = subsections.concat(edges.subsect(e0, e1));
      }
    });
  });
  return subsections;
}

export function same(f0, f1) {
  const e0s = f0.edges(), e1s = f1.edges();
  if (e0s.length != e1s.length) return false;
  return e0s.reduce((same, e0) => {
    if (same.result) {
      const index = same.remaining.findIndex(e1 => edges.same(e0, e1));
      if (index === -1) {
        same.result = false;
      } else {
        same.remaining.splice(index, 1);
      }
    }
    return same;
  }, {result: true, remaining: e1s}).result;
}

export function siblings(f0, f1) {
  return (
    coincidentAny(f0.edges(), f1.edges())
    || sharedVerticesAny(f0.vertices(), f1.vertices())
  );
}

export function overlap(f0, f1) {
  // Fast check to eliminate work if overlap is impossible.
  if (!boundsCheck(f0._bound, f1._bound)) return false;
  
  // Any intersection means certain overlap.
  if (intersectAny(f0.edges(), f1.edges())) return true;

  // If any vertex is within a figure, we have overlap.
  // It's possible that all points lie on a vertex or edge and so vertexWithin
  // will return undefined. In the case that every point is undefined, we
  // must check if the figures are the same. If they are not, then the two
  // figures do not overlap but are perfect complements.
  const f0vs = f0.vertices().concat(f0.edges().map(e => e.midpoint()));
  const f0in = f0vs.map(v => vertexWithin(f1, v));
  if (!f0in.every(v => v === undefined) && f0in.some(v => v == true)) return true;

  const f1vs = f1.vertices().concat(f1.edges().map(e => e.midpoint()));
  const f1in = f1vs.map(v => vertexWithin(f0, v));
  if (!f1in.every(v => v === undefined) && f1in.some(v => v == true)) return true;

  // If we've made it this far, they might just be the same exact figure.
  return same(f0, f1);
}

export function coincident(f0, f1) {
  return coincidentAny(f0.edges(), f1.edges());
}

export function intersect(f0, f1) {
  return intersectAny(f0.edges(), f1.edges());
}

function coincidentAny(e0s, e1s) {
  return arrayAny(e0s, e1s, (a, b) => edges.coincident(a, b));
}

function intersectAny(e0s, e1s) {
  return arrayAny(e0s, e1s, (a, b) => edges.intersect(a, b));
}

function sharedVerticesAny(v0s, v1s) {
  return arrayAny(v0s, v1s, (a, b) => vertex.same(a, b));
}

function arrayAny(a0, a1, comparator) {
  return a0.some(a => {
    return a1.some(b => {
      return comparator(a, b);
    });
  });
}

function getBounds(vertices) {
  const functor = (v) => { return {_v: v, map: function (fn) { return fn(this._v); }}; };
  return functor(vertices
    .reduce((carry, v) => {
      carry.minX = (v.x < carry.minX || carry.minX === undefined) ? v.x : carry.minX;
      carry.minY = (v.y < carry.minY || carry.minY === undefined) ? v.y : carry.minY;
      carry.maxX = (v.x > carry.maxX || carry.maxX === undefined) ? v.x : carry.maxX;
      carry.maxY = (v.y > carry.maxY || carry.maxY === undefined) ? v.y : carry.maxY;
      return carry;
    }, {}))
    .map(reduced => {
      return new edges.Edge([
        [reduced.minX, reduced.minY],
        [reduced.maxX, reduced.maxY]
      ]);
    });
}

// Determines if overlap is possible using two bounding boxes.
function boundsCheck(boundA, boundB) {
  const e0s = boundA.box().edges(), e1s = boundB.box().edges();
  return (
    intersectAny(e0s, e1s) ||
    coincidentAny(e0s, e1s) ||
    boundA.vertices().some(v => edges.withinBounds(boundB, v)) ||
    boundB.vertices().some(v => edges.withinBounds(boundA, v))
  );
}

// An odd number of intersections means that a vertex is within a figure.
function vertexWithin(figure, v) {
  const bndLn = figure._bound.length() * 1000;
  const ray0 = new edges.Edge([[v.x, v.y], [v.x + bndLn, v.y]]);
  const ray1 = new edges.Edge([[v.x, v.y], [v.x + bndLn, v.y + bndLn/100]]);
  const fEdges = figure.edges();

  let ixs = 0;
  let invalid = false;
  fEdges.forEach(e => {
    if (invalid) return;

    invalid = (
      edges.on(e, v) ||
      vertex.same(e.left(), v) ||
      vertex.same(e.right(), v)
    );

    ixs += (
      !invalid &&
      (edges.intersect(ray0, e) || edges.intersect(ray1, e))
    ) ? 1 : 0;
  });

  return (invalid) ? undefined : ixs % 2 === 1;
}
