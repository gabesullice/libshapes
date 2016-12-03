"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.same = same;
exports.rotate = rotate;
exports.shift = shift;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EPSILON = exports.EPSILON = 0.0000001;

var Vertex = exports.Vertex = function Vertex(x, y) {
  _classCallCheck(this, Vertex);

  this.x = x;
  this.y = y;
};

function same(va, vb) {
  var xeq = Math.abs(va.x - vb.x) <= EPSILON;
  var yeq = Math.abs(va.y - vb.y) <= EPSILON;
  return xeq && yeq;
}

function rotate(v, angle) {
  return new Vertex(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle));
}

function shift(v, shift) {
  return new Vertex(v.x + shift[0], v.y + shift[1]);
}