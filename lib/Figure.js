"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Figure = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.overlap = overlap;

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

function overlap(f0, f1) {
  var e0s = f0.edges(),
      e1s = f1.edges();
  for (var k0 in e0s) {
    for (var k1 in e1s) {
      if (edges.intersect(e0s[k0], e1s[k1])) return true;
    }
  }
  return false;
}