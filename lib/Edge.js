"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Edge = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.intersect = intersect;

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
    key: "interceptY",
    value: function interceptY() {
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

function intersect(e0, e1) {
  // If any of the edge vertices as the same, these edges cannot intersect.
  if (sharedVertices(e0, e1)) {
    return false;
  }
  // Find the slope of the lines.
  var m0 = e0.slope(),
      m1 = e1.slope();
  // If the slopes are the same, these edges cannot intersect.
  if (Math.abs(m1 - m0) <= EPSILON) {
    return false;
  }
  // Find the y-intercepts of the lines.
  var b0 = e0.interceptY(),
      b1 = e1.interceptY();
  // Find the x intersection.
  var x = (b1 - b0) / (m0 - m1);
  // Find the y intersection.
  var y = m0 * x + b0;
  // Define a vertex at the point (x,y).
  var intersection = new vertex.Vertex(x, y);
  // Now determine if (x,y) falls within the bounding box of e0.
  return withinBounds(e0, intersection);
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