"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Edge = require("../lib/Edge");

var edges = _interopRequireWildcard(_Edge);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Composition = function () {
  function Composition(options) {
    _classCallCheck(this, Composition);

    if (options === undefined) {
      this.bounds([0, 0], [100, 100]);
    } else {
      this.bounds.apply(this, options.bounds);
    }
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
    value: function bounds(b0, b1) {
      if (b0 !== undefined && b1 !== undefined) {
        this._bounds = new edges.Edge([b0, b1]);
      }
      var l = this._bounds.left(),
          r = this._bounds.right();
      var ret = [[l.x, l.y], [r.x, r.y]];
      return ret;
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
    key: "get",
    value: function get(id) {
      return this._figures.hasOwnProperty(id) ? this._figures[id] : null;
    }
  }, {
    key: "overlapping",
    value: function overlapping() {
      var pairs = this._findPairs(function (a, b) {
        var same = true;
        // Check all edge combinations.
        // @todo: optimize this so that it doesn't run each check twice.
        a.edges().forEach(function (ea) {
          b.edges().forEach(function (eb) {
            console.log(ea, eb);
            if (edges.intersect(ea, eb)) {
              console.log('intersecting');
              return true;
            }
            //console.log('not intersecting');
            if (!same && !edges.same(ea, eb)) {
              same = false;
            }
          });
        });
        return !same;
      });
      return Object.keys(pairs);
    }
  }, {
    key: "_findPairs",
    value: function _findPairs(paired) {
      var pairs = {};
      var figures = this.figures();
      console.log(figures);
      var figureNames = Object.getOwnPropertyNames(figures);
      figureNames.forEach(function (idA) {
        figureNames.forEach(function (idB) {
          if (!pairs.hasOwnProperty(idB) || !pairs[idB].includes(idA)) {
            var A = figures[idA],
                B = figures[idB];
            if (paired(A, B)) {
              insertPair(pairs, idA, idB);
            }
          }
        });
      });
      return pairs;
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


function insertPair(pairs, a, b) {
  if (!pairs[a]) {
    pairs[a] = [b];
  } else {
    pairs[a].push(b);
  }
  if (!pairs[b]) {
    pairs[b] = [a];
  } else {
    pairs[b].push(a);
  }
}