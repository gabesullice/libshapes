"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Edge = require("../../lib/Edge");

var edges = _interopRequireWildcard(_Edge);

var _Vertex = require("../../lib/Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Figure = require("../../lib/Figure");

var figures = _interopRequireWildcard(_Figure);

var _Shape = require("../../lib/Shape");

var _Shape2 = _interopRequireDefault(_Shape);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GapFinder = function () {
  function GapFinder() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        vertexTree = _ref.vertexTree,
        subsectTree = _ref.subsectTree;

    _classCallCheck(this, GapFinder);

    this._vTree = vertexTree;
    this._subsectTree = subsectTree;
  }

  _createClass(GapFinder, [{
    key: "gapsFrom",
    value: function gapsFrom(figure, knownGaps) {
      var _this = this;

      var figureEdges = figure.edges();

      var lonely = figureEdges.filter(function (edge) {
        var subsected = edge.vertices().reduce(function (subsected, v) {
          var at = _this._subsectTree.at(v) || { edges: [] };
          return subsected.concat(at.edges);
        }, []);

        var coincident = function coincident(compare) {
          return edges.coincident(edge, compare);
        };
        return !subsected.some(coincident);
      });

      //if (this.doLog) console.log('figureEdges', figureEdges);
      //if (this.doLog) console.log('lonely', lonely);

      if (figureEdges.length > lonely.length && lonely.length > 0) {
        return lonely.reduce(function (gaps, edge, i) {
          var found = _this.findGap(edge, figure);

          // If we found a gap...
          if (found) {
            //if (this.doLog) console.log(found);
            //if (this.doLog) console.log(this._gaps);
            // and it's not one that we've already found...
            var duplicate = gaps.concat(knownGaps).some(function (gap) {
              return gap.vertices().every(function (v0) {
                return found.vertices().some(function (v1) {
                  return vertex.same(v0, v1);
                });
              });
            });

            if (!duplicate) {
              //if (this.doLog) console.log(found);
              gaps.push(found);
            }
          }

          return gaps;
        }, []);
      } else {
        return [];
      }
    }
  }, {
    key: "findGap",
    value: function findGap(fromEdge, figure) {
      var v0 = fromEdge.left(),
          v1 = fromEdge.right();
      //if (this.doLog) console.log('fromEdge', fromEdge);
      var gap0 = this._walkGap([v0, v1], 0);
      var gap1 = this._walkGap([v1, v0], 0);

      var sameAsFig = function sameAsFig(gap) {
        return gap.every(function (v0) {
          var res = figure.vertices().some(function (v1) {
            return vertex.same(v0, v1);
          });
          return res;
        });
      };

      //if (this.doLog) console.log('gap0', gap0);
      //if (this.doLog) console.log('gap1', gap1);

      if (gap0 && !sameAsFig(gap0)) {
        var points = gap0.map(function (v) {
          return [v.x, v.y];
        });
        return new figures.Figure({ shape: new _Shape2.default(points) });
      } else if (gap1 && !sameAsFig(gap1)) {
        var _points = gap1.map(function (v) {
          return [v.x, v.y];
        });
        return new figures.Figure({ shape: new _Shape2.default(_points) });
      } else {
        return false;
      }
    }
  }, {
    key: "_walkGap",
    value: function _walkGap(gap, count) {
      // Prevents getting into an infinite loop.
      if (count > 75) return false;

      //if (this.doLog) console.log('gap', gap);

      var prev = gap[gap.length - 2];
      var curr = gap[gap.length - 1];
      var next = this.nextVertex(prev, curr);

      if (vertex.same(next, prev)) {
        return false;
      }

      if (vertex.same(next, gap[0])) {
        return gap;
      }

      gap.push(next);

      return this._walkGap(gap, count + 1);
    }
  }, {
    key: "nextVertex",
    value: function nextVertex(last, current) {
      var edge = new edges.Edge([[last.x, last.y], [current.x, current.y]]);
      var around = this._getPossibleEdges(current);
      var possibles = around.filter(function (possible) {
        return !edges.same(edge, possible);
      });
      //if (this.doLog) console.log('current', current);
      //if (this.doLog) console.log('around', around);
      //if (this.doLog) console.log('possibles', possibles);

      var nextEdge = this._nearestEdge(edge, possibles);

      // Derive the next vertex in the gap from the nearest edge.
      var next = nextEdge.vertices().filter(function (v) {
        return !vertex.same(current, v);
      })[0];

      return next;
    }
  }, {
    key: "_getPossibleEdges",
    value: function _getPossibleEdges(v) {
      var regular = this._vTree.at(v) || { edges: [] };
      var subsected = this._subsectTree.at(v) || { edges: [] };
      var original = regular.edges;
      var derived = subsected.edges.filter(function (edge) {
        var same = function same(compare) {
          return edges.same(edge, compare);
        };
        return !original.some(same);
      });
      //if (this.doLog) console.log('v', v);
      //if (this.doLog) console.log('original', original);
      //if (this.doLog) console.log('subsected', subsected.edges);
      //if (this.doLog) console.log('derived', derived);
      return this._removeDuplicateEdges(original).concat(derived);
    }
  }, {
    key: "_removeDuplicateEdges",
    value: function _removeDuplicateEdges(bundle) {
      return bundle.filter(function (edge, i, all) {
        return !all.some(function (compare, j) {
          var same = edges.same(edge, compare) && i != j;
          return same;
        });
      });
    }
  }, {
    key: "_nearestEdge",
    value: function _nearestEdge(to, bundle) {
      //if (this.doLog) console.log('to', to);
      //if (this.doLog) console.log('bundle', bundle);
      bundle.sort(function (a, b) {
        if (a.angle() < b.angle()) {
          return -1;
        } else if (a.angle() == b.angle() && a.angle() == 0) {
          if (vertex.same(a.right(), b.left())) {
            return 1;
          } else if (vertex.same(b.right(), a.left())) {
            return -1;
          } else {
            return a.length() < b.length() ? -1 : 1;
          }
        } else if (a.angle() == b.angle() && a.angle() == Math.PI / 2) {
          if (vertex.same(a.top(), b.bottom())) {
            return 1;
          } else if (vertex.same(b.top(), a.bottom())) {
            return -1;
          } else {
            return a.length() < b.length() ? -1 : 1;
          }
        } else {
          return 1;
        }
      });
      var nextIndex = 0;
      for (var i = 0; i < bundle.length; i++) {
        if (to.angle() < bundle[i].angle()) {
          nextIndex = i;
          break;
        }
      }
      return bundle[nextIndex];
    }
  }]);

  return GapFinder;
}();

exports.default = GapFinder;