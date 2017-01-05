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

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GapFinder = function () {
  function GapFinder() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        vertexTree = _ref.vertexTree,
        subsectTree = _ref.subsectTree,
        _ref$debug = _ref.debug,
        debug = _ref$debug === undefined ? false : _ref$debug;

    _classCallCheck(this, GapFinder);

    this._vTree = vertexTree;
    this._subsectTree = subsectTree;
    this._debug = debug;
  }

  _createClass(GapFinder, [{
    key: "debug",
    value: function debug(isOn) {
      if (isOn !== undefined) {
        this._debug = isOn;
      }
      return this._debug;
    }
  }, {
    key: "log",
    value: function log(label, variable, message) {
      if (this.debug()) {
        if (message) {
          console.log(label, variable, message);
        } else {
          console.log(label, variable);
        }
      }
    }
  }, {
    key: "gapsFrom",
    value: function gapsFrom(figure, knownGaps) {
      var _this = this;

      var figureEdges = figure.edges();
      var lonely = figure.edges().filter(function (e0, _, original) {
        var _ref2;

        var siblings = (_ref2 = []).concat.apply(_ref2, _toConsumableArray(e0.vertices().reduce(function (items, v) {
          items.push(_this._vTree.at(v));
          items.push(_this._subsectTree.at(v));
          return items;
        }, []).filter(function (item) {
          return item !== undefined;
        }).map(function (item) {
          return item.edges;
        })));

        var counts = siblings.reduce(function (counts, edge) {
          var index = counts.findIndex(function (count) {
            return edges.same(edge, count.edge);
          });
          if (index !== -1) {
            counts[index].count++;
          } else {
            counts.push({ edge: edge, count: 1 });
          }
          return counts;
        }, []);

        var remaining = counts.filter(function (count) {
          return count.count > 2;
        }).map(function (count) {
          return count.edge;
        });

        return !remaining.some(function (e1) {
          return edges.same(e0, e1);
        });
      });
      //const lonely = figureEdges.filter(edge => {
      //  const subsected = edge.vertices().reduce((subsected, v) => {
      //    const at = this._subsectTree.at(v) || {edges: []};
      //    return subsected.concat(at.edges);
      //  }, []);

      //  const coincident = (compare) => { return edges.coincident(edge, compare); };
      //  return !subsected.some(coincident);
      //});

      if (figureEdges.length > lonely.length && lonely.length > 0) {
        return lonely.reduce(function (gaps, edge, i) {
          var found = _this.findGap(edge, figure);

          // If we found a gap...
          if (found) {
            // and it's not one that we've already found...
            var duplicate = gaps.concat(knownGaps).some(function (gap) {
              return gap.vertices().every(function (v0) {
                return found.vertices().some(function (v1) {
                  return vertex.same(v0, v1);
                });
              });
            });

            if (!duplicate) {
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
      var gap0 = this.walkGap([v0, v1], 0);
      var gap1 = this.walkGap([v1, v0], 0);

      var sameAsFig = function sameAsFig(gap) {
        return gap.every(function (v0) {
          var res = figure.vertices().some(function (v1) {
            return vertex.same(v0, v1);
          });
          return res;
        });
      };

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
    key: "walkGap",
    value: function walkGap(gap, count) {
      // Prevents getting into an infinite loop.
      if (count > 75) return false;

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

      return this.walkGap(gap, count + 1);
    }
  }, {
    key: "nextVertex",
    value: function nextVertex(last, current) {
      var edge = new edges.Edge([[last.x, last.y], [current.x, current.y]]);
      var around = this._getPossibleEdges(current);
      var possibles = around.filter(function (possible) {
        return !edges.same(edge, possible);
      });

      var nextEdge = this._nearestEdge(edge, current, possibles);

      // Derive the next vertex in the gap from the nearest edge.
      var next = nextEdge.vertices().filter(function (v) {
        return !vertex.same(current, v);
      })[0];

      return next;
    }
  }, {
    key: "_getPossibleEdges",
    value: function _getPossibleEdges(v) {
      var _this2 = this,
          _ref3;

      var regular = this._vTree.at(v) || { edges: [] };
      var subsected = this._subsectTree.at(v) || { edges: [] };
      // Get all the edges around a vertex into one array.
      var all = regular.edges.concat(subsected.edges);

      // Group all the edges by their angle.
      all = all.reduce(function (all, edge) {
        if (all.length === 0) {
          all.push([edge]);
        } else {
          var index = all.findIndex(function (elem) {
            return Math.abs(edge.angle() - elem[0].angle()) < vertex.EPSILON && edges.coincident(edge, elem[0]);
          });
          if (index !== -1) {
            all[index].push(edge);
          } else {
            all.push([edge]);
          }
        }
        return all;
      }, []);

      // Sort groups by their length.
      all = all.map(function (group) {
        group.sort(function (a, b) {
          return a.length() < b.length() ? -1 : 1;
        });
        return group;
      });

      // Look for any edges that may be hiding along the shortest edge.
      all = all.map(function (group) {
        var shortest = group[0];
        var closest = shortest.opposite(v);
        var query = { origin: shortest.midpoint(), radius: shortest.length() / 2 };
        var result = _this2._subsectTree.find(query);
        if (result && result.length > 0) {
          // 1. Extract the vertex from the result items.
          // 2. Filter out results which do not fall on the shortest edges line.
          // 3. Compute the distances from the original vertex and store it in a POJO.
          // 4. Find the nearest vertex.
          // 5. Extract that vertex from the POJO.
          var nearest = result.map(function (item) {
            return item.vertex;
          }).filter(function (vFound) {
            var b = vFound.y - shortest.slope() * vFound.x;
            return Math.abs(b - shortest.yIntercept()) < vertex.EPSILON;
          }).map(function (vFound) {
            return { vertex: vFound, distance: vertex.distance(v, vFound) };
          }).reduce(function (nearest, current) {
            return nearest.distance < current.distance ? nearest : current;
          }, { vertex: closest, distance: shortest.length() }).vertex;

          group.unshift(new edges.Edge([[v.x, v.y], [nearest.x, nearest.y]]));

          return group;
        } else {
          return group;
        }
      });

      // Ungroup all the edges.
      all = (_ref3 = []).concat.apply(_ref3, _toConsumableArray(all));

      // Count and record the occasions of duplicate edges. 
      var counted = all.reduce(function (counts, edge) {
        var index = counts.findIndex(function (count) {
          return edges.same(edge, count.edge);
        });
        if (index !== -1) {
          counts[index].count++;
        } else {
          counts.push({ edge: edge, count: 1 });
        }
        return counts;
      }, []);

      // Get only the edges with 2 or fewer occurences.
      var possibles = counted.filter(function (count) {
        return count.count < 3;
      }).map(function (count) {
        return count.edge;
      });

      return possibles;
    }
  }, {
    key: "_nearestEdge",
    value: function _nearestEdge(to, around, bundle) {
      bundle.sort(function (a, b) {
        var t0 = a.angle(around),
            t1 = b.angle(around);
        if (t0 < t1) {
          return -1;
        } else if (t0 == t1 && t0 == 0) {
          if (vertex.same(a.right(), b.left())) {
            return 1;
          } else if (vertex.same(b.right(), a.left())) {
            return -1;
          } else {
            return a.length() < b.length() ? -1 : 1;
          }
        } else if (t0 == t1 && t0 == Math.PI / 2) {
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
      var theta = to.angle(around);
      for (var i = 0; i < bundle.length; i++) {
        var compare = bundle[i].angle(around);
        if (theta < compare) {
          nextIndex = i;
          break;
        }
      }
      return bundle[nextIndex];
    }
  }, {
    key: "_getAngle",
    value: function _getAngle(edge, v) {
      var same = function same(v0, v1) {
        return vertex.same(v0, v1);
      };
      var angle = function angle(v0, v1) {
        return Math.atan2(v0.x - v1.x, v0.y - v1.y);
      };
      return same(edge.left(), v) ? angle(v, edge.right()) : angle(v, edge.left());
    }
  }]);

  return GapFinder;
}();

exports.default = GapFinder;