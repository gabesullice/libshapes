import * as vertex from "./Vertex";
import Shape from "./Shape";

const EPSILON = vertex.EPSILON;

export class Edge {

  constructor(points) {
    this._a = new vertex.Vertex(points[0][0], points[0][1]);
    this._b = new vertex.Vertex(points[1][0], points[1][1]);
    this._slope = slope(this._a, this._b);
    this._angle = angle(this._a, this._b);
    // must come after _a and _b are defined.
    this._box = box(this);
  }

  slope() {
    return this._slope;
  }

  angle(from) {
    if (from !== undefined) {
      const to = (vertex.same(from, this._a)) ? this._b : this._a;
      return vertex.angleBetween(from, to);
    }
    return this._angle;
  }

  vertices() {
    return [this._a, this._b];
  }

  yIntercept() {
    return this._a.y - (this.slope() * this._a.x);
  }

  length() {
    return vertex.distance(this._a, this._b);
  }

  midpoint() {
    return new vertex.Vertex(
      (this.right().x + this.left().x)/2,
      (this.top().y + this.bottom().y)/2
    );
  }

  left() {
    return (this._a.x < this._b.x) ? this._a : this._b;
  }

  right() {
    return (this._a.x < this._b.x) ? this._b : this._a;
  }

  top() {
    return (this._a.y < this._b.y) ? this._b : this._a;
  }

  bottom() {
    return (this._a.y < this._b.y) ? this._a : this._b;
  }

  opposite(v) {
    return (vertex.same(v, this.left())) ? this.right() : this.left();
  }

  box() {
    return this._box;
  }

}

export function same(a, b) {
  return (
    (vertex.same(a._a, b._a) && vertex.same(a._b, b._b))
    ||
    (vertex.same(a._a, b._b) && vertex.same(a._b, b._a))
  );
}

export function intersect(e0, e1) {
  // If any of the edge vertices as the same, these edges cannot intersect.
  if (sharedVertices(e0, e1)) {
    return false;
  }
  // Find the slope of the lines.
  const m0 = e0.slope(), m1 = e1.slope();
  // If the slopes are the same, these edges cannot intersect.
  // Using atan() to convert slope of Infinity into something we can use.
  if (Math.abs(Math.atan(m1) - Math.atan(m0)) <= EPSILON) {
    return false;
  }
  // If either slope is Infinity, we can skip some work.
  let x, y;
  if (Math.abs(m0) == Infinity ^ Math.abs(m1) == Infinity) {
    x = (Math.abs(m0) == Infinity) ? e0.left().x : e1.left().x;
    y = (Math.abs(m0) == Infinity) ? m1 * x + e1.yIntercept() : m0 * x + e0.yIntercept();
  } else {
    // Find the y-intercepts of the lines.
    const b0 = e0.yIntercept(), b1 = e1.yIntercept();
    // Find the x intersection.
    x = (b1 - b0)/(m0 - m1);
    // Find the y intersection.
    y = m0 * x + b0;
  }
  // Define a vertex at the point (x,y).
  const intersection = new vertex.Vertex(x, y);
  // Now determine if (x,y) falls within the bounding box of e0 or e1.
  return withinBounds(e0, intersection) && withinBounds(e1, intersection);
}

export function coincident(e0, e1) {
  // If these edges are the same, then they are coincident.
  if (same(e0, e1)) {
    return true;
  }
  // Find the slope of the lines.
  const m0 = e0.slope(), m1 = e1.slope();
  // Helps determine if an edge is withinBounds of the other edge
  const inBounds = (e0, e1) => {
    return (
      e0.vertices().some(v => withinBounds(e1, v))
      || e1.vertices().some(v => withinBounds(e0, v))
    );
  };
  // Handle the special case of two infinite slopes.
  if (Math.abs(m0) === Infinity && Math.abs(m1) === Infinity) {
    // If these lines don't have the same x intercept, they're no coincident.
    if (e0.left().x != e1.left().x) {
      return false;
    }
    return inBounds(e0, e1);
  }
  // If the slopes are not the same, these edges cannot be coincident.
  if (Math.abs(m1 - m0) > EPSILON) {
    return false;
  }
  // Find the y-intercepts of the lines.
  const b0 = e0.yIntercept(), b1 = e1.yIntercept();
  // If the y-intercepts are not the same, these edges cannot be coincident.
  if (Math.abs(b1 - b0) > EPSILON) {
    return false;
  }
  // No vertices were in the bounds of an edge, the edges are not coincident.
  // If any vertex falls within the bounds of an edge, the edges are coincident,
  // if not, they cannot be coincident at this point.
  return inBounds(e0, e1);
}

export function subsect(e0, e1) {
  // If edges are not coincident, there are no edge subsections.
  if (!coincident(e0, e1)) {
    return [];
  }
  // Sort the edge vertices left to right, bottom to top on the cartesian plane.
  const vertices = e0.vertices().concat(e1.vertices());
  const sorted = vertices.sort((va, vb) => {
    if (vertex.same(va, vb)) return 0;
    return (va.x < vb.x || va.y < vb.y) ? -1 : 1;
  });
  // Collect the all edges between the sorted vertices.
  return sorted.reduceRight((edges, v, i, arr) => {
    // If we're on the last vertex or the vertices are the same skip.
    if (i == 0 || vertex.same(v, arr[i - 1])) return edges;
    // Create and edge and add it to all our edges.
    edges.unshift(new Edge([[arr[i - 1].x, arr[i - 1].y], [v.x, v.y]]));
    return edges;
  }, []);
}

export function vertexIntersection(e, v) {
  // Find the line defined by e.
  const m = e.slope(), b = e.yIntercept();
  let ix, iy;
  // If the slope is +/-Infinity we can skip some computation.
  if (Math.abs(m) == Infinity) {
    ix =  e.left().x;
    iy =  v.y;
  } else if (Math.abs(m) < EPSILON) {
    ix = v.x;
    // Find the y-coord where this line intersects e.
    iy = e.left().y;
  } else {
    // Find the line perpendicular to e which passes through v.
    // Find the x-coord where this line intersects e.
    ix = ( b - (v.y + v.x / m) ) * -m / (m * m + 1); 
    // Find the y-coord where this line intersects e.
    iy = m * ix + b;
  }
  // Create the vertex at (ix,iy).
  const iv = new vertex.Vertex(ix, iy);
  // Return iv if falls on e. If not, there is no intersection.
  return (on(e, iv)) ? iv : null;
}

export function vertexDistance(edge, v) {
  const iv = vertexIntersection(edge, v);
  // If there is a perpendicular intersection of e and v, compute that distance.
  if (iv !== null) {
    return vertex.distance(iv, v);
  } else {
    // Otherwise, find the distance of v to the nearest vertex of e.
    return Math.min(
      vertex.distance(edge.left(), v),
      vertex.distance(edge.right(), v)
    );
  }
}

export function withinBounds(edge, v) {
  const m = Math.abs(edge.slope());
  if (m == Infinity) {
    const bottom = edge.bottom(), top = edge.top();
    return (eqEpsilon(bottom.x, v.x) && bottom.y < v.y && v.y < top.y);
  } else if (m < EPSILON) {
    const left = edge.left(), right = edge.right();
    return (eqEpsilon(left.y, v.y) && left.x < v.x && v.x < right.x);
  } else {
    return (
      (edge.left().x < v.x && v.x < edge.right().x) &&
      (edge.bottom().y < v.y && v.y < edge.top().y)
    );
  }
}

export function on(edge, v) {
  // Find the line defined by e.
  const m = edge.slope(), b = edge.yIntercept();
  if (Math.abs(m) === Infinity) {
    return eqEpsilon(v.x, edge.left().x) && v.y >= edge.bottom().y && v.y <= edge.top().y;
  } else if (Math.abs(m) < EPSILON) {
    return eqEpsilon(v.y, edge.bottom().y) && v.x >= edge.left().x && v.x <= edge.right().x;
  } else {
    // Does the point fall on the line defined by e?
    const onLine = vertex.same(v, new vertex.Vertex(v.x, m * v.x + b));
    // Is the point within e?
    const inEdge = withinBounds(edge, new vertex.Vertex(v.x, m * v.x + b));
    return onLine && inEdge;
  }
}

function sharedVertices(a, b) {
  const a0 = a.left(), a1 = a.right();
  const b0 = b.left(), b1 = b.right();
  return (
    vertex.same(a0, b0)
    || vertex.same(a0, b1)
    || vertex.same(a1, b0)
    || vertex.same(a1, b1)
  );
}

function angle(v0, v1) {
  return Math.atan(slope(v0, v1));
}

function slope(v0, v1) {
  return (v1.y - v0.y)/(v1.x - v0.x);
}

function box(edge) {
  return new Shape([
    [edge.left().x,  edge.bottom().y],
    [edge.left().x,  edge.top().y],
    [edge.right().x, edge.top().y],
    [edge.right().x, edge.bottom().y],
  ]);
}

function eqEpsilon(a, b) {
  return Math.abs(a - b) < EPSILON;
}
