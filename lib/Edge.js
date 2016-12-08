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

var _Vertex = require("./Vertex.js");

var vertex = _interopRequireWildcard(_Vertex);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EPSILON = vertex.EPSILON;

var Edge = exports.Edge = function () {
  function Edge(points) {
    _classCallCheck(this, Edge);

    this._a = new vertex.Vertex(points[0][0], points[0][1]);
    this._b = new vertex.Vertex(points[1][0], points[1][1]);
  }

  _createClass(Edge, [{
    key: "slope",
    value: function slope() {
      return (this._b.y - this._a.y) / (this._b.x - this._a.x);
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
  }]);

  return Edge;
}();

function same(e0, e1) {
  var v0 = e0.left(),
      v1 = e0.right(),
      v2 = e1.left(),
      v3 = e1.right();
  return vertex.same(v0, v2) && vertex.same(v1, v3);
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
  // Now determine if (x,y) falls within the bounding box of e0.
  var bound = Math.abs(m0) == Infinity ? e1 : e0;
  return withinBounds(bound, intersection);
}

function coincident(e0, e1) {
  // Find the slope of the lines.
  var m0 = e0.slope(),
      m1 = e1.slope();
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
  // If these edges share the same vertices, then they are coincident.
  if (sharedVertices(e0, e1)) {
    return true;
  }
  // If any vertex falls within the bounds of an edge, the edges are coincident.
  if (withinBounds(e1, e0.left()) || withinBounds(e1, e0.right())) {
    return true;
  }
  if (withinBounds(e0, e1.left()) || withinBounds(e0, e1.right())) {
    return true;
  }
  // No vertices were in the bounds of an edge, the edges are not coincident.
  return false;
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

function on(edge, v) {
  // Find the line defined by e.
  var m = edge.slope(),
      b = edge.yIntercept();
  if (Math.abs(m) == Infinity) {
    return v.x >= edge.left().x && v.x <= edge.right().x;
  } else if (Math.abs(m) === 0) {
    return v.y >= edge.bottom().y && v.y <= edge.top().y;
  } else {
    return withinBounds(edge, new vertex.Vertex(v.x, m * v.x + b));
  }
}

function withinBounds(edge, v) {
  return edge.left().x < v.x && v.x < edge.right().x && edge.bottom().y < v.y && v.y < edge.top().y;
}

function sharedVertices(e0, e1) {
  var v0 = e0.left(),
      v1 = e0.right(),
      v2 = e1.left(),
      v3 = e1.right();
  return vertex.same(v0, v1) || vertex.same(v0, v2) || vertex.same(v0, v3) || vertex.same(v1, v2) || vertex.same(v1, v3) || vertex.same(v2, v3);
}