"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Composition = function () {
  function Composition(options) {
    _classCallCheck(this, Composition);

    this._bounds = options === undefined ? [100, 100] : options.bounds;
    this._count = 0;
    this._figures = {};
  }

  _createClass(Composition, [{
    key: "figures",
    value: function figures() {
      return this._figures;
    }
  }, {
    key: "bounds",
    value: function bounds(values) {
      if (values !== undefined) {
        this._bounds = values;
      }
      return this._bounds;
    }
  }, {
    key: "add",
    value: function add(figure) {
      var id = this._getID();
      this._figures[id] = figure;
      return id;
    }
  }, {
    key: "remove",
    value: function remove(id) {
      return delete this._figures[id];
    }
  }, {
    key: "_getID",
    value: function _getID() {
      var id = "fig-" + this._count;
      this._count++;
      return id;
    }
  }]);

  return Composition;
}();

exports.default = Composition;