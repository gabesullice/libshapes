"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vertex = require("./Vertex.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class() {
    var _this = this;

    _classCallCheck(this, _class);

    var args = Array.from(arguments);
    this._vertices = [];
    args.forEach(function (arg, index) {
      _this._vertices[index] = new _Vertex.Vertex(arg[0], arg[1]);
    });
  }

  _createClass(_class, [{
    key: "vertices",
    value: function vertices() {
      return this._vertices;
    }
  }]);

  return _class;
}();

exports.default = _class;