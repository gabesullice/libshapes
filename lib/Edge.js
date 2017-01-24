"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Edge = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.same = same;
exports.intersect = intersect;
exports.coincident = coincident;
exports.subsect = subsect;
exports.vertexIntersection = vertexIntersection;
exports.vertexDistance = vertexDistance;
exports.withinBounds = withinBounds;
exports.on = on;

var _Vertex = require("./Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Shape = require("./Shape");

var _Shape2 = _interopRequireDefault(_Shape);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EPSILON = vertex.EPSILON;

var Edge = exports.Edge = function () {
  function Edge(points) {
    _classCallCheck(this, Edge);

    this._a = new vertex.Vertex(points[0][0], points[0][1]);
    this._b = new vertex.Vertex(points[1][0], points[1][1]);
    this._slope = slope(this._a, this._b);
    this._angle = angle(this._a, this._b);
    // must come after _a and _b are defined.
    this._box = box(this);
  }

  _createClass(Edge, [{
    key: "slope",
    value: function slope() {
      return this._slope;
    }
  }, {
    key: "angle",
    value: function angle(from) {
      if (from !== undefined) {
        var to = vertex.same(from, this._a) ? this._b : this._a;
        return vertex.angleBetween(from, to);
      }
      return this._angle;
    }
  }, {
    key: "vertices",
    value: function vertices() {
      return [this._a, this._b];
    }
  }, {
    key: "yIntercept",
    value: function yIntercept() {
      return this._a.y - this.slope() * this._a.x;
    }
  }, {
    key: "length",
    value: function length() {
      return vertex.distance(this._a, this._b);
    }
  }, {
    key: "midpoint",
    value: function midpoint() {
      return new vertex.Vertex((this.right().x + this.left().x) / 2, (this.top().y + this.bottom().y) / 2);
    }
  }, {
    key: "left",
    value: function left() {
      return this._a.x < this._b.x ? this._a : this._b;
    }
  }, {
    key: "right",
    value: function right() {
      return this._a.x < this._b.x ? this._b : this._a;
    }
  }, {
    key: "top",
    value: function top() {
      return this._a.y < this._b.y ? this._b : this._a;
    }
  }, {
    key: "bottom",
    value: function bottom() {
      return this._a.y < this._b.y ? this._a : this._b;
    }
  }, {
    key: "opposite",
    value: function opposite(v) {
      return vertex.same(v, this.left()) ? this.right() : this.left();
    }
  }, {
    key: "box",
    value: function box() {
      return this._box;
    }
  }]);

  return Edge;
}();

function same(a, b) {
  return vertex.same(a._a, b._a) && vertex.same(a._b, b._b) || vertex.same(a._a, b._b) && vertex.same(a._b, b._a);
}

function intersect(e0, e1) {
  // If any of the edge vertices as the same, these edges cannot intersect.
  if (sharedVertices(e0, e1)) {
    return false;
  }
  // Find the slope of the lines.
  var m0 = e0.slope(),
      m1 = e1.slope();
  // If the slopes are the same, these edges cannot intersect.
  // Using atan() to convert slope of Infinity into something we can use.
  if (Math.abs(Math.atan(m1) - Math.atan(m0)) <= EPSILON) {
    return false;
  }
  // If either slope is Infinity, we can skip some work.
  var x = void 0,
      y = void 0;
  if (Math.abs(m0) == Infinity ^ Math.abs(m1) == Infinity) {
    x = Math.abs(m0) == Infinity ? e0.left().x : e1.left().x;
    y = Math.abs(m0) == Infinity ? m1 * x + e1.yIntercept() : m0 * x + e0.yIntercept();
  } else {
    // Find the y-intercepts of the lines.
    var b0 = e0.yIntercept(),
        b1 = e1.yIntercept();
    // Find the x intersection.
    x = (b1 - b0) / (m0 - m1);
    // Find the y intersection.
    y = m0 * x + b0;
  }
  // Define a vertex at the point (x,y).
  var intersection = new vertex.Vertex(x, y);
  // Now determine if (x,y) falls within the bounding box of e0 or e1.
  return withinBounds(e0, intersection) && withinBounds(e1, intersection);
}

function coincident(e0, e1) {
  // If these edges are the same, then they are coincident.
  if (same(e0, e1)) {
    return true;
  }
  // Find the slope of the lines.
  var m0 = e0.slope(),
      m1 = e1.slope();
  // Helps determine if an edge is withinBounds of the other edge
  var inBounds = function inBounds(e0, e1) {
    return e0.vertices().some(function (v) {
      return withinBounds(e1, v);
    }) || e1.vertices().some(function (v) {
      return withinBounds(e0, v);
    });
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
  var b0 = e0.yIntercept(),
      b1 = e1.yIntercept();
  // If the y-intercepts are not the same, these edges cannot be coincident.
  if (Math.abs(b1 - b0) > EPSILON) {
    return false;
  }
  // No vertices were in the bounds of an edge, the edges are not coincident.
  // If any vertex falls within the bounds of an edge, the edges are coincident,
  // if not, they cannot be coincident at this point.
  return inBounds(e0, e1);
}

function subsect(e0, e1) {
  // If edges are not coincident, there are no edge subsections.
  if (!coincident(e0, e1)) {
    return [];
  }
  // Sort the edge vertices left to right, bottom to top on the cartesian plane.
  var vertices = e0.vertices().concat(e1.vertices());
  var sorted = vertices.sort(function (va, vb) {
    if (vertex.same(va, vb)) return 0;
    return va.x < vb.x || va.y < vb.y ? -1 : 1;
  });
  // Collect the all edges between the sorted vertices.
  return sorted.reduceRight(function (edges, v, i, arr) {
    // If we're on the last vertex or the vertices are the same skip.
    if (i == 0 || vertex.same(v, arr[i - 1])) return edges;
    // Create and edge and add it to all our edges.
    edges.unshift(new Edge([[arr[i - 1].x, arr[i - 1].y], [v.x, v.y]]));
    return edges;
  }, []);
}

function vertexIntersection(e, v) {
  // Find the line defined by e.
  var m = e.slope(),
      b = e.yIntercept();
  var ix = void 0,
      iy = void 0;
  // If the slope is +/-Infinity we can skip some computation.
  if (Math.abs(m) == Infinity) {
    ix = e.left().x;
    iy = v.y;
  } else if (Math.abs(m) === 0) {
    ix = v.x;
    // Find the y-coord where this line intersects e.
    iy = e.left().y;
  } else {
    // Find the line perpendicular to e which passes through v.
    // Find the x-coord where this line intersects e.
    ix = (b - (v.y + v.x / m)) * -m / (m * m + 1);
    // Find the y-coord where this line intersects e.
    iy = m * ix + b;
  }
  // Create the vertex at (ix,iy).
  var iv = new vertex.Vertex(ix, iy);
  // Return iv if falls on e. If not, there is no intersection.
  return on(e, iv) ? iv : null;
}

function vertexDistance(edge, v) {
  var iv = vertexIntersection(edge, v);
  // If there is a perpendicular intersection of e and v, compute that distance.
  if (iv !== null) {
    return vertex.distance(iv, v);
  } else {
    // Otherwise, find the distance of v to the nearest vertex of e.
    return Math.min(vertex.distance(edge.left(), v), vertex.distance(edge.right(), v));
  }
}

function withinBounds(edge, v) {
  var m = Math.abs(edge.slope());
  if (m == Infinity) {
    var bottom = edge.bottom(),
        top = edge.top();
    return bottom.x == v.x && bottom.y < v.y && v.y < top.y;
  } else if (m < EPSILON) {
    var left = edge.left(),
        right = edge.right();
    return left.y == v.y && left.x < v.x && v.x < right.x;
  } else {
    return edge.left().x < v.x && v.x < edge.right().x && edge.bottom().y < v.y && v.y < edge.top().y;
  }
}

function on(edge, v) {
  // Find the line defined by e.
  var m = edge.slope(),
      b = edge.yIntercept();
  if (Math.abs(m) === Infinity) {
    return v.x == edge.left().x && v.y >= edge.bottom().y && v.y <= edge.top().y;
  } else if (Math.abs(m) < EPSILON) {
    return v.y == edge.bottom().y && v.x >= edge.left().x && v.x <= edge.right().x;
  } else {
    // Does the point fall on the line defined by e?
    var onLine = vertex.same(v, new vertex.Vertex(v.x, m * v.x + b));
    // Is the point within e?
    var inEdge = withinBounds(edge, new vertex.Vertex(v.x, m * v.x + b));
    return onLine && inEdge;
  }
}

function sharedVertices(a, b) {
  var a0 = a.left(),
      a1 = a.right();
  var b0 = b.left(),
      b1 = b.right();
  return vertex.same(a0, b0) || vertex.same(a0, b1) || vertex.same(a1, b0) || vertex.same(a1, b1);
}

function angle(v0, v1) {
  return Math.atan(slope(v0, v1));
}

function slope(v0, v1) {
  return (v1.y - v0.y) / (v1.x - v0.x);
}

function box(edge) {
  return new _Shape2.default([[edge.left().x, edge.bottom().y], [edge.left().x, edge.top().y], [edge.right().x, edge.top().y], [edge.right().x, edge.bottom().y]]);
}