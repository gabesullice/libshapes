"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Figure = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

exports.subsect = subsect;
exports.same = same;
exports.siblings = siblings;
exports.overlap = overlap;
exports.coincident = coincident;
exports.intersect = intersect;
exports.denormalize = denormalize;

var _Vertex = require("./Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Edge = require("./Edge");

var edges = _interopRequireWildcard(_Edge);

var _Shape = require("./Shape");

var shapes = _interopRequireWildcard(_Shape);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Figure = function () {
  function Figure(values) {
    (0, _classCallCheck3.default)(this, Figure);

    this._shape = values.shape;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this._position = values.position === undefined ? [0, 0] : values.position;
    this._reflection = values.reflection === undefined ? { x: false, y: false } : values.reflection;
    this._compute();
  }

  (0, _createClass3.default)(Figure, [{
    key: "normalize",
    value: function normalize() {
      return {
        type: "figure",
        data: {
          shape: this.shape().normalize(),
          rotation: this.rotation(),
          position: { x: this.position()[0], y: this.position()[1] },
          reflection: this._reflection
        }
      };
    }
  }, {
    key: "shape",
    value: function shape(_shape) {
      if (_shape !== undefined) {
        this._shape = _shape;
        this._compute();
      }
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
    key: "reflectX",
    value: function reflectX() {
      this._reflection.x = this._reflection.x ? false : true;
      this.shape(this.shape().rotate(this._rotation).reflectX().rotate(-this._rotation));
      this._compute();
      return this;
    }
  }, {
    key: "reflectY",
    value: function reflectY() {
      this._reflection.y = this._reflection.y ? false : true;
      this.shape(this.shape().rotate(this._rotation).reflectY().rotate(-this._rotation));
      this._compute();
      return this;
    }
  }, {
    key: "_innerVertices",
    value: function _innerVertices() {
      var _this = this;

      var vAvg = this._vertexAverage();
      return [vAvg].filter(function (v) {
        return vertexWithin(_this, v);
      });
    }
  }, {
    key: "_vertexAverage",
    value: function _vertexAverage() {
      var vs = this.vertices();
      var vAvg = vs.reduce(function (vAvg, v) {
        return new vertex.Vertex(vAvg.x + v.x, vAvg.y + v.y);
      }, new vertex.Vertex(0, 0));
      return new vertex.Vertex(vAvg.x / vs.length, vAvg.y / vs.length);
    }
  }, {
    key: "_compute",
    value: function _compute(debug) {
      this._computed = this.shape().rotate(this._rotation);

      if (this._reflection.x) {
        //this._computed = this._computed.reflect(this._rotation);
        //this._computed = this._computed.reflectX();
      }

      if (this._reflection.y) {
        //this._computed = this._computed.reflect(this._rotation + Math.PI / 2);
        //this._computed = this._computed.reflectY();
      }

      this._computed = this._computed.translate(this._position);

      this._bound = getBounds(this.vertices());
    }
  }]);
  return Figure;
}();

exports.Figure = Figure;
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

  // Whether a point is valid to test. It is invalid if it's on an edge or another vertex.
  var validPoint = function validPoint(e, v) {
    return !edges.on(e, v) && !vertex.same(e.left(), v) && !vertex.same(e.right(), v);
  };

  // If any vertex is within a figure, we have overlap.
  // It's possible that all points lie on a vertex or edge and so vertexWithin
  // will return undefined. In the case that every point is undefined, we
  // must check if the figures are the same. If they are not, then the two
  // figures do not overlap but are perfect complements.
  var f0vs = f0.vertices().concat(f0.edges().map(function (e) {
    return e.midpoint();
  })).concat(f0._innerVertices()).filter(function (v) {
    return edges.withinBounds(f1._bound, v);
  }).filter(function (v) {
    return f1.edges().every(function (e) {
      return validPoint(e, v);
    });
  });

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
  })).concat(f1._innerVertices()).filter(function (v) {
    return edges.withinBounds(f0._bound, v);
  }).filter(function (v) {
    return f0.edges().every(function (e) {
      return validPoint(e, v);
    });
  });

  var f1in = f1vs.map(function (v) {
    return vertexWithin(f0, v);
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

function denormalize(content) {
  if (content.type != 'figure') {
    throw Error('Unexpected type. Unable to denormalize.');
  }
  try {
    content.data.shape = shapes.denormalize(content.data.shape);
    content.data.position = [content.data.position.x, content.data.position.y];
    return new Figure(content.data);
  } catch (e) {
    throw Error('Unexpected data. Unable to denormalize.');
  }
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
function vertexWithin(figure, v) {
  var bndLn = figure._bound.length() * 1000;
  var ray0 = new edges.Edge([[v.x, v.y], [v.x + bndLn, v.y]]);
  var ray1 = new edges.Edge([[v.x - bndLn, v.y + bndLn / 79], [v.x, v.y]]);
  var fEdges = figure.edges();

  // Count the number of intersections for both rays.
  var r0ixs = 0,
      r1ixs = 0;
  fEdges.forEach(function (e) {
    r0ixs += edges.intersect(ray0, e) ? 1 : 0;
    r1ixs += edges.intersect(ray1, e) ? 1 : 0;
  });

  return r0ixs % 2 === 1 || r1ixs % 2 === 1;
}