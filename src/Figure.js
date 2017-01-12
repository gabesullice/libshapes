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

export function same(f0, f1, debug) {
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
  //return f0.edges().every(e0 => {
  //  return f1.edges().some(e1 => {
  //    const res = edges.same(e0, e1);
  //    //if (debug && !res) console.log(e0, e1);
  //    return res
  //  });
  //});
}

export function siblings(f0, f1) {
  return (
    coincidentAny(f0.edges(), f1.edges())
    || sharedVerticesAny(f0.vertices(), f1.vertices())
  );
}

export function overlap(f0, f1) {
  return intersectAny(
    f0.edges().concat(f0.innerEdges()),
    f1.edges().concat(f1.innerEdges()),
  );
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
