"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.same = exports.Shape = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vertex = require("./Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Edge = require("./Edge");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Shape = function () {
  function Shape(points) {
    var _this = this;

    _classCallCheck(this, Shape);

    this._vertices = [];
    points.forEach(function (point, index) {
      _this._vertices[index] = new vertex.Vertex(point[0], point[1]);
    });
  }

  _createClass(Shape, [{
    key: "vertices",
    value: function vertices() {
      return this._vertices;
    }
  }, {
    key: "edges",
    value: function edges() {
      return this._vertices.reduce(function (edges, v, i, arr) {
        // If this is the first vertex, create an edge to join it with the last.
        var next = i == arr.length - 1 ? arr[0] : arr[i + 1];
        edges.push(new _Edge.Edge([[v.x, v.y], [next.x, next.y]]));
        return edges;
      }, []);
    }
  }, {
    key: "rotate",
    value: function rotate(angle) {
      return new Shape(this._vertices.map(function (v) {
        var rotated = vertex.rotate(v, angle);
        return [rotated.x, rotated.y];
      }));
    }
  }, {
    key: "translate",
    value: function translate(translation) {
      return new Shape(this._vertices.map(function (v) {
        var translated = vertex.translate(v, translation);
        return [translated.x, translated.y];
      }));
    }
  }, {
    key: "reflectX",
    value: function reflectX() {
      return this._reflect(this, function (v) {
        return new vertex.Vertex(v.x, v.y * -1);
      });
    }
  }, {
    key: "reflectY",
    value: function reflectY() {
      return this._reflect(this, function (v) {
        return new vertex.Vertex(v.x * -1, v.y);
      });
    }
  }, {
    key: "_reflect",
    value: function _reflect(shape, reflector) {
      return new Shape(shape._vertices.map(function (v) {
        var reflected = reflector(v);
        return [reflected.x, reflected.y];
      }));
    }
  }]);

  return Shape;
}();

function same(s0, s1) {
  // Get the vertices of the shape as arrays.
  var v0s = s0.vertices(),
      v1s = s1.vertices();

  // Quick parity check.
  if (v0s.length != v1s.length) return false;

  var v0 = v0s.pop();
  while (v0) {
    // Does v0 exist in v1s?
    var index = v1s.findIndex(function (v1) {
      return vertex.same(v0, v1);
    });
    // If not, shapes are different.
    if (index === -1) return false;
    // If so, remove the vertex from the array so we don't use it twice.
    v1s.splice(index, 1);
    // Get the next vertex out of v0s.
    v0 = v0s.pop();
  }
  // If we made it this far, the shapes are the same.
  return true;
}

exports.default = Shape;
exports.Shape = Shape;
exports.same = same;