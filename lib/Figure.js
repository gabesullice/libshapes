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
exports.intersect = intersect;

var _Edge = require("../lib/Edge");

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

function same(f0, f1, debug) {
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
  //return f0.edges().every(e0 => {
  //  return f1.edges().some(e1 => {
  //    const res = edges.same(e0, e1);
  //    //if (debug && !res) console.log(e0, e1);
  //    return res
  //  });
  //});
}

function siblings(f0, f1) {
  return coincidentAny(f0.edges(), f1.edges());
}

function overlap(f0, f1) {
  return intersectAny(f0.edges().concat(f0.innerEdges()), f1.edges().concat(f1.innerEdges()));
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

function arrayAny(a0, a1, comparator) {
  return a0.some(function (a) {
    return a1.some(function (b) {
      return comparator(a, b);
    });
  });
}