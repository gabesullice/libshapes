"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Vertex = require("../lib/Vertex");

var vertex = _interopRequireWildcard(_Vertex);

var _Edge = require("../lib/Edge");

var edges = _interopRequireWildcard(_Edge);

var _Figure = require("../lib/Figure");

var figures = _interopRequireWildcard(_Figure);

var _Shape = require("../lib/Shape");

var _Shape2 = _interopRequireDefault(_Shape);

var _vertexTree = require("vertex-tree");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Composition = function () {
  function Composition(options) {
    _classCallCheck(this, Composition);

    var bounds = [[0, 0], [100, 100]];
    var doSnap = true;
    var snapTolerance = 0.001;
    var processGaps = false;
    if (options !== undefined) {
      if (options.hasOwnProperty('bounds')) bounds = options.bounds;
      if (options.hasOwnProperty('snap')) doSnap = options.snap;
      if (options.hasOwnProperty('snapTolerance')) snapTolerance = options.snapTolerance;
      if (options.hasOwnProperty('processGaps')) processGaps = options.processGaps;
    }
    this.bounds.apply(this, bounds);
    this._doSnap = doSnap;
    this._doProcessGaps = processGaps;
    this.snapTolerance(snapTolerance);
    this._count = 0;
    this._figures = {};
    this._overlapping = [];
    this._gaps = [];
    this._vTree = new _vertexTree.VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length()
    });
    this._subsectTree = new _vertexTree.VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length()
    });
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
    key: "snapTolerance",
    value: function snapTolerance(tolerance) {
      if (tolerance !== undefined) {
        this._tolerance = tolerance;
      }
      return this._tolerance;
    }
  }, {
    key: "add",
    value: function add(figure, options) {
      var id = this._getID();
      this._figures[id] = figure;
      this._iterateFigures(id, "insert");
      this._addToTree(figure);
      if (this._doProcessGaps) {
        this._processGaps(figure);
      }
      this._handleSnap(id, options);
      return id;
    }
  }, {
    key: "_processGaps",
    value: function _processGaps(figure) {
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

      if (lonely.length > 0) {
        var gaps = lonely.reduce(function (gaps, edge, i) {
          var found = _this._findGap(edge, figure);

          // If we found a gap...
          if (found) {
            // and it's not one that we've already found...
            var duplicate = gaps.concat(_this._gaps).some(function (gap) {
              return gap.every(function (v0) {
                return found.some(function (v1) {
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

        this._gaps = this._gaps.concat(gaps);
      }
    }
  }, {
    key: "_findGap",
    value: function _findGap(fromEdge, figure) {
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

      if (gap0 && !sameAsFig(gap0)) {
        return gap0;
      } else if (gap1 && !sameAsFig(gap1)) {
        return gap1;
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
      var next = this._nextVertex(prev, curr);

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
    key: "_nextVertex",
    value: function _nextVertex(last, current) {
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
  }, {
    key: "_getFigureSiblings",
    value: function _getFigureSiblings(figure) {
      var _this2 = this;

      // walk around the figure, find sibling figures.
      return figure.vertices().reduce(function (siblings, v) {
        var items = _this2._vTree.at(v);
        if (items) {
          siblings = items.tags.filter(function (tag) {
            return tag != figure.id;
          }) // no the current figure
          .map(function (fid) {
            return _this2.get(fid);
          }) // map ids to real objects
          .reduce(function (siblings, fig) {
            // put them in our collection of figures unless it's already there.
            if (!siblings.find(function (item) {
              item.id == fig.id;
            })) {
              siblings.push(fig);
            }
          }, siblings);
        }
        return siblings;
      }, []);
    }
  }, {
    key: "remove",
    value: function remove(id) {
      if (this._figures.hasOwnProperty(id)) {
        this._removeOverlaps(id);
        this._iterateFigures(id, "remove");
        this._removeFromTree(this._figures[id]);
        return delete this._figures[id];
      }
      return false;
    }
  }, {
    key: "get",
    value: function get(id) {
      return this._figures.hasOwnProperty(id) ? this._figures[id] : null;
    }
  }, {
    key: "move",
    value: function move(id, translation, options) {
      this._removeFromTree(this._figures[id]);
      var start = this._figures[id].position();
      var target = this._figures[id].position(translation);
      var final = this._handleSnap(id, options);
      this._removeOverlaps(id);
      this._addToTree(this._figures[id]);
      this._iterateFigures(id, "insert");
      if (this._doProcessGaps) {
        // @todo: REMOVE NEXT LINE
        this._gaps = [];
        this._processGaps(figure);
      }
      return {
        start: start, target: target, final: final,
        snapped: this._doSnap && (target[0] != final[0] || target[1] != final[1])
      };
    }
  }, {
    key: "overlapping",
    value: function overlapping() {
      return this._overlapping;
    }
  }, {
    key: "gaps",
    value: function gaps() {
      return this._gaps.map(function (gap) {
        var points = gap.map(function (v) {
          return [v.x, v.y];
        });
        return new figures.Figure({ shape: new _Shape2.default(points) });
      });
    }
  }, {
    key: "_handleSnap",
    value: function _handleSnap(id, options) {
      var doSnap = this._doSnap;
      if (options !== undefined) {
        if (options.hasOwnProperty('snap')) doSnap = options.snap;
      }
      if (doSnap) {
        this._figures[id].translate(this._calculateSnap(this._figures[id]));
      }
      return this._figures[id].position();
    }
  }, {
    key: "_iterateFigures",
    value: function _iterateFigures(id, op) {
      var figs = this._figures;
      var iteratorFuncs = [];
      switch (op) {
        case "insert":
          iteratorFuncs = this._getInsertIteratorFuncs();
          break;
        case "remove":
          iteratorFuncs = this._getRemoveIteratorFuncs();
          break;
      }
      for (var k in figs) {
        if (id != k) {
          for (var funcName in iteratorFuncs) {
            iteratorFuncs[funcName]({ id: k, figure: figs[k] }, { id: id, figure: figs[id] });
          }
        }
      }
    }
  }, {
    key: "_getInsertIteratorFuncs",
    value: function _getInsertIteratorFuncs() {
      var _this3 = this;

      return {
        overlap: function overlap(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this3._overlapping.push({ a: a.id, b: b.id });
          }
        },
        subsections: this._subsectionProcessor(function (section, tags) {
          _this3._subsectTree.insertEdge(section, tags);
        })
      };
    }
  }, {
    key: "_getRemoveIteratorFuncs",
    value: function _getRemoveIteratorFuncs() {
      var _this4 = this;

      return {
        subsections: this._subsectionProcessor(function (section) {
          _this4._subsectTree.removeEdge(section);
        })
      };
    }
  }, {
    key: "_subsectionProcessor",
    value: function _subsectionProcessor(finalOp) {
      return function (a, b) {
        var aEdges = a.figure.edges(),
            bEdges = b.figure.edges();
        aEdges.forEach(function (e0) {
          bEdges.forEach(function (e1) {
            if (edges.coincident(e0, e1)) {
              edges.subsect(e0, e1)
              //.filter(section => {
              //  // filter out any subsections that are already known edges.
              //  const same = (test) => {
              //    return edges.same(section, test);
              //  };
              //  return !aEdges.some(same) && !bEdges.some(same);
              //})
              .forEach(function (section) {
                // now that we've found relevant subsectios, do a final
                // operation on them;
                finalOp(section, [a.id, b.id]);
              });
            }
          });
        });
      };
    }
  }, {
    key: "_removeOverlaps",
    value: function _removeOverlaps(id) {
      this._overlapping = this._overlapping.filter(function (overlap) {
        return !(overlap.a == id || overlap.b == id);
      });
    }
  }, {
    key: "_calculateSnap",
    value: function _calculateSnap(fig) {
      var figs = this._figures;
      var tolerance = this._tolerance * vertex.distance(this._bounds.left(), this._bounds.right());
      var verticesA = fig.vertices();
      for (var i in verticesA) {
        for (var j in figs) {
          var verticesB = figs[j].vertices();
          for (var k in verticesB) {
            var va = verticesA[i],
                vb = verticesB[k];
            var vd = vertex.distance(va, vb);
            if (vd > vertex.EPSILON && vd < tolerance) {
              return [vb.x - va.x, vb.y - va.y];
            }
          }
        }
      }
      return [0, 0];
    }
  }, {
    key: "_getID",
    value: function _getID() {
      var id = "fig-" + this._count;
      this._count++;
      return id;
    }
  }, {
    key: "_addToTree",
    value: function _addToTree(figure) {
      var _this5 = this;

      figure.edges().forEach(function (edge) {
        _this5._vTree.insertEdge(edge, [figure.id]);
      });
    }
  }, {
    key: "_removeFromTree",
    value: function _removeFromTree(figure) {
      var _this6 = this;

      figure.edges().forEach(function (edge) {
        edge.vertices().forEach(function (v) {
          var found = _this6._vTree.at(v);
          if (found) {
            _this6._vTree.removeEdge(edge);
            if (found.edges.length == 0) {
              _this6._vTree.remove(v);
            } else {
              found.removeTag(figure.id);
            }
          }
        });
      });
    }
  }]);

  return Composition;
}();

exports.default = Composition;