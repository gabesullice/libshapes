"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Figure = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.subsect = subsect;
exports.same = same;
exports.siblings = siblings;
exports.overlap = overlap;
exports.coincident = coincident;
exports.intersect = intersect;

var _Vertex = require("./Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Edge = require("./Edge");

var edges = _interopRequireWildcard(_Edge);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Figure = exports.Figure = function () {
  function Figure(values) {
    _classCallCheck(this, Figure);

    this._shape = values.shape;
    this._position = values.position === undefined ? [0, 0] : values.position;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this._compute();
  }

  _createClass(Figure, [{
    key: "shape",
    value: function shape() {
      return this._shape;
    }
  }, {
    key: "vertices",
    value: function vertices() {
      return this._computed.vertices();
    }
  }, {
    key: "edges",
    value: function edges() {
      return this._computed.edges();
    }
  }, {
    key: "innerEdges",
    value: function innerEdges() {
      var vs = this.vertices();
      var inner = [];
      for (var i = 0; i < vs.length - 1; i++) {
        for (var j = i + 1; j < vs.length; j++) {
          var first = vs[i],
              second = vs[j];
          inner.push(new edges.Edge([[first.x, first.y], [second.x, second.y]]));
        }
      }
      return inner;
    }
  }, {
    key: "position",
    value: function position(pos) {
      if (pos !== undefined) {
        this._position = pos;
        this._compute();
      }
      return this._position;
    }
  }, {
    key: "translate",
    value: function translate(offset) {
      return this.position([this._position[0] + offset[0], this._position[1] + offset[1]]);
    }
  }, {
    key: "rotation",
    value: function rotation(angle) {
      if (angle !== undefined) {
        this._rotation = angle;
        this._compute();
      }
      return this._rotation;
    }
  }, {
    key: "rotate",
    value: function rotate(angle) {
      return this.rotation((this._rotation + angle) % (2 * Math.PI));
    }
  }, {
    key: "_compute",
    value: function _compute() {
      this._computed = this._shape.rotate(this._rotation).translate(this._position);
      this._bound = getBounds(this.vertices());
    }
  }]);

  return Figure;
}();

function subsect(f0, f1) {
  var e0s = f0.edges(),
      e1s = f1.edges();
  var subsections = [];
  e0s.forEach(function (e0) {
    e1s.forEach(function (e1) {
      if (edges.coincident(e0, e1)) {
        subsections = subsections.concat(edges.subsect(e0, e1));
      }
    });
  });
  return subsections;
}

function same(f0, f1) {
  var e0s = f0.edges(),
      e1s = f1.edges();
  if (e0s.length != e1s.length) return false;
  return e0s.reduce(function (same, e0) {
    if (same.result) {
      var index = same.remaining.findIndex(function (e1) {
        return edges.same(e0, e1);
      });
      if (index === -1) {
        same.result = false;
      } else {
        same.remaining.splice(index, 1);
      }
    }
    return same;
  }, { result: true, remaining: e1s }).result;
}

function siblings(f0, f1) {
  return coincidentAny(f0.edges(), f1.edges()) || sharedVerticesAny(f0.vertices(), f1.vertices());
}

function overlap(f0, f1) {
  // Fast check to eliminate work if overlap is impossible.
  if (!boundsCheck(f0._bound, f1._bound)) return false;

  // Any intersection means certain overlap.
  if (intersectAny(f0.edges(), f1.edges())) return true;

  // If any vertex is within a figure, we have overlap.
  // It's possible that all points lie on a vertex or edge and so vertexWithin
  // will return undefined. In the case that every point is undefined, we
  // must check if the figures are the same. If they are not, then the two
  // figures do not overlap but are perfect complements.
  var f0vs = f0.vertices().concat(f0.edges().map(function (e) {
    return e.midpoint();
  }));
  var f0in = f0vs.map(function (v) {
    return vertexWithin(f1, v);
  });
  if (!f0in.every(function (v) {
    return v === undefined;
  }) && f0in.some(function (v) {
    return v == true;
  })) return true;

  var f1vs = f1.vertices().concat(f1.edges().map(function (e) {
    return e.midpoint();
  }));
  var f1in = f1vs.map(function (v) {
    return vertexWithin(f0, v, debug);
  });
  if (!f1in.every(function (v) {
    return v === undefined;
  }) && f1in.some(function (v) {
    return v == true;
  })) return true;

  // If we've made it this far, they might just be the same exact figure.
  return same(f0, f1);
}

function coincident(f0, f1) {
  return coincidentAny(f0.edges(), f1.edges());
}

function intersect(f0, f1) {
  return intersectAny(f0.edges(), f1.edges());
}

function coincidentAny(e0s, e1s) {
  return arrayAny(e0s, e1s, function (a, b) {
    return edges.coincident(a, b);
  });
}

function intersectAny(e0s, e1s) {
  return arrayAny(e0s, e1s, function (a, b) {
    return edges.intersect(a, b);
  });
}

function sharedVerticesAny(v0s, v1s) {
  return arrayAny(v0s, v1s, function (a, b) {
    return vertex.same(a, b);
  });
}

function arrayAny(a0, a1, comparator) {
  return a0.some(function (a) {
    return a1.some(function (b) {
      return comparator(a, b);
    });
  });
}

function getBounds(vertices) {
  var functor = function functor(v) {
    return { _v: v, map: function map(fn) {
        return fn(this._v);
      } };
  };
  return functor(vertices.reduce(function (carry, v) {
    carry.minX = v.x < carry.minX || carry.minX === undefined ? v.x : carry.minX;
    carry.minY = v.y < carry.minY || carry.minY === undefined ? v.y : carry.minY;
    carry.maxX = v.x > carry.maxX || carry.maxX === undefined ? v.x : carry.maxX;
    carry.maxY = v.y > carry.maxY || carry.maxY === undefined ? v.y : carry.maxY;
    return carry;
  }, {})).map(function (reduced) {
    return new edges.Edge([[reduced.minX, reduced.minY], [reduced.maxX, reduced.maxY]]);
  });
}

// Determines if overlap is possible using two bounding boxes.
function boundsCheck(boundA, boundB) {
  var e0s = boundA.box().edges(),
      e1s = boundB.box().edges();
  return intersectAny(e0s, e1s) || coincidentAny(e0s, e1s) || boundA.vertices().some(function (v) {
    return edges.withinBounds(boundB, v);
  }) || boundB.vertices().some(function (v) {
    return edges.withinBounds(boundA, v);
  });
}

// An odd number of intersections means that a vertex is within a figure.
function vertexWithin(figure, v, debug) {
  var bndLn = figure._bound.length();
  var ray0 = new edges.Edge([[v.x, v.y], [v.x + bndLn, v.y]]);
  var ray1 = new edges.Edge([[v.x, v.y], [v.x + bndLn, v.y + bndLn / 2]]);
  var fEdges = figure.edges();

  var ixs = 0;
  var invalid = false;
  fEdges.forEach(function (e) {
    if (invalid) return;

    invalid = edges.on(e, v) || vertex.same(e.left(), v) || vertex.same(e.right(), v);

    ixs += !invalid && (edges.intersect(ray0, e) || edges.intersect(ray1, e)) ? 1 : 0;
  });

  return invalid ? undefined : ixs % 2 === 1;
}