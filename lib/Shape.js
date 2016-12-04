"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
  }]);

  return Shape;
}();

exports.default = Shape;