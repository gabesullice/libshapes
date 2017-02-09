"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.same = same;
exports.distance = distance;
exports.rotate = rotate;
exports.translate = translate;
exports.reflect = reflect;
exports.angleBetween = angleBetween;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EPSILON = exports.EPSILON = 0.0001;

var Vertex = exports.Vertex = function Vertex(x, y) {
  _classCallCheck(this, Vertex);

  this.x = x;
  this.y = y;
};

function same(va, vb) {
  return distance(va, vb) <= EPSILON;
}

function distance(va, vb) {
  return Math.sqrt(Math.pow(Math.abs(va.x - vb.x), 2) + Math.pow(Math.abs(va.y - vb.y), 2));
}

function rotate(v, angle) {
  return new Vertex(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle));
}

function translate(v, translation) {
  return new Vertex(v.x + translation[0], v.y + translation[1]);
}

function reflect(v, angle) {
  return new Vertex(Math.cos(2 * angle) * v.x + Math.sin(2 * angle) * v.y, Math.sin(2 * angle) * v.x + -Math.cos(2 * angle) * v.y);
}

function angleBetween(v0, v1) {
  var t = Math.atan2(v1.y - v0.y, v1.x - v0.x);
  return t < 0 ? Math.PI * 2 + t : t;
}