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
    this._intersecting = [];
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
    key: "get",
    value: function get(id) {
      return this._figures.hasOwnProperty(id) ? this._figures[id] : null;
    }
  }, {
    key: "overlapping",
    value: function overlapping() {
      return this._overlapping;
    }
  }, {
    key: "gaps",
    value: function gaps() {
      return this._gaps;
    }
  }, {
    key: "add",
    value: function add(figure, options) {
      var id = this._getID();
      this._doOperations(id, figure, this._getOperations("insert"));
      return id;
    }
  }, {
    key: "remove",
    value: function remove(id) {
      if (this._figures.hasOwnProperty(id)) {
        this._doOperations(id, this._figures[id], this._getOperations("remove"));
        return delete this._figures[id];
      }
      return false;
    }
  }, {
    key: "move",
    value: function move(id, position, options) {
      this._removeFromTree(this._figures[id]);
      var start = this._figures[id].position();
      var target = this._figures[id].position(position);
      var final = this._handleSnap(id, options);
      this._removeOverlaps(id);
      this._removeIntersections(id);
      this._addToTree(this._figures[id]);
      this._iterateFigures(id, this._getIteratorFuncs("insert"));
      //this._removeGaps(id);
      this._processGaps(id, this._figures[id]);
      return {
        start: start, target: target, final: final,
        snapped: this._doSnap && (target[0] != final[0] || target[1] != final[1])
      };
    }
  }, {
    key: "_doOperations",
    value: function _doOperations(id, figure, operations) {
      var _this = this;

      this._organizeOperations(operations).forEach(function (set) {
        if (set.hasOwnProperty("singular")) {
          set.singular.forEach(function (operation) {
            try {
              operation.func(id, figure);
            } catch (e) {
              console.log("\"" + operation.description + "\" failed with exception:", e);
            }
          });
        }

        if (set.hasOwnProperty("iterator")) {
          Object.keys(_this._figures).forEach(function (fid) {
            var curr = _this._figures[fid];
            if (id != fid) {
              set.iterator.forEach(function (operation) {
                try {
                  operation.func({ id: id, figure: figure }, { id: fid, figure: curr });
                } catch (e) {
                  console.log("\"" + operation.description + "\" failed with exception:", e);
                }
              });
            }
          });
        }
      });
    }
  }, {
    key: "_organizeOperations",
    value: function _organizeOperations(operations) {
      // 1. Only return operations for the given action
      // 2. Sort the operations by weight
      // 3. Bundle the operations by weight into sets of operation
      // 4. Bundle operations within each set by their type
      return operations.sort(function (a, b) {
        return a.weight < b.weight ? -1 : 1;
      }).reduce(function (ops, operation) {
        if (ops.lastWeight === undefined) {
          ops.sets[0].push(operation);
        } else if (ops.lastWeight < operation.weight) {
          ops.sets.push([operation]);
        } else {
          ops.sets[ops.sets.length - 1].push(operation);
        }
        ops.lastWeight = operation.weight;
        return ops;
      }, { lastWeight: undefined, sets: [[]] }).sets.map(function (set) {
        return set.reduce(function (ops, operation) {
          if (ops[operation.type] === undefined) {
            ops[operation.type] = [operation];
          } else {
            ops[operation.type].push(operation);
          }
          return ops;
        }, {});
      });
    }
  }, {
    key: "_getOperations",
    value: function _getOperations(action) {
      var _this2 = this;

      return [{
        description: "Adds a figure to the figures list",
        action: "insert",
        type: "singular",
        weight: -100,
        func: function func(id, figure) {
          return _this2._figures[id] = figure;
        }
      }, {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: -1,
        func: function func(_, figure) {
          return _this2._addToTree(figure);
        }
      }, {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 0,
        func: function func(id, figure) {
          return _this2._processGaps(id, figure);
        }
      }, {
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -2,
        func: function func(id) {
          return _this2._handleSnap(id);
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "insert",
        type: "iterator",
        weight: -5,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this2._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores overlapping figures",
        action: "insert",
        type: "iterator",
        weight: -4,
        func: function func(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this2._overlapping.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "insert",
        type: "iterator",
        weight: -3,
        func: this._subsectionProcessor(function (section, tags) {
          _this2._subsectTree.insertEdge(section, tags);
        })
      }, {
        description: "Removes any overlap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this2._removeOverlaps(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this2._removeIntersections(id);
        }
      }, {
        description: "Removes any gap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this2._removeGaps(id);
        }
      }, {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: this._subsectionProcessor(function (section) {
          _this2._subsectTree.removeEdge(section);
        })
      }, {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(_, figure) {
          return _this2._removeFromTree(figure);
        }
      }].filter(function (elem) {
        return elem.action === action;
      });
    }
  }, {
    key: "_processGaps",
    value: function _processGaps(id, figure) {
      var _this3 = this;

      if (!this._doProcessGaps) return;

      // If this figure intersects with another figure, do not find its gaps.
      //if (this.doLog) console.log(id, this._intersecting);
      if (this._intersecting.some(function (i) {
        return i.a == id || i.b == id;
      })) {
        return;
      }

      var figureEdges = figure.edges();

      var lonely = figureEdges.filter(function (edge) {
        var subsected = edge.vertices().reduce(function (subsected, v) {
          var at = _this3._subsectTree.at(v) || { edges: [] };
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
        var gaps = lonely.reduce(function (gaps, edge, i) {
          var found = _this3._findGap(edge, figure);

          // If we found a gap...
          if (found) {
            //if (this.doLog) console.log(found);
            //if (this.doLog) console.log(this._gaps);
            // and it's not one that we've already found...
            var duplicate = gaps.concat(_this3._gaps).some(function (gap) {
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
      var _this4 = this;

      // walk around the figure, find sibling figures.
      return figure.vertices().reduce(function (siblings, v) {
        var items = _this4._vTree.at(v);
        if (items) {
          siblings = items.tags.filter(function (tag) {
            return tag != figure.id;
          }) // no the current figure
          .map(function (fid) {
            return _this4.get(fid);
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
    key: "_removeGaps",
    value: function _removeGaps(removedId) {
      var _this5 = this;

      if (!this._doProcessGaps) return;

      var removed = this._figures[removedId];

      this._gaps.forEach(function (gap, index) {
        if (gap.edges().some(function (gapEdge, index) {
          return removed.edges().some(function (removeEdge) {
            return edges.coincident(gapEdge, removeEdge);
          });
        })) {
          delete _this5._gaps[index];
          _this5._processGaps("gap", gap);
        };
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
    key: "_iterateFigures",
    value: function _iterateFigures(id, iteratorFuncs) {
      var figs = this._figures;
      for (var k in figs) {
        if (id != k) {
          var figA = figs[k],
              figB = figs[id];
          for (var funcName in iteratorFuncs) {
            iteratorFuncs[funcName]({ id: k, figure: figA }, { id: id, figure: figB });
          }
        }
      }
    }
  }, {
    key: "_getIteratorFuncs",
    value: function _getIteratorFuncs(operation) {
      var _this6 = this;

      var funcs = {
        insert: {
          intersect: function intersect(a, b) {
            if (figures.intersect(a.figure, b.figure)) {
              _this6._intersecting.push({ a: a.id, b: b.id });
            }
          },
          overlap: function overlap(a, b) {
            if (figures.overlap(a.figure, b.figure)) {
              _this6._overlapping.push({ a: a.id, b: b.id });
            }
          },
          subsections: this._subsectionProcessor(function (section, tags) {
            _this6._subsectTree.insertEdge(section, tags);
          })
        },
        remove: {},
        move: {}
      };

      return funcs[operation];
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
              edges.subsect(e0, e1).forEach(function (section) {
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
    key: "_removeIntersections",
    value: function _removeIntersections(id) {
      this._intersecting = this._intersecting.filter(function (intersect) {
        return !(intersect.a == id || intersect.b == id);
      });
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
      var _this7 = this;

      figure.edges().forEach(function (edge) {
        _this7._vTree.insertEdge(edge, [figure.id]);
      });
    }
  }, {
    key: "_removeFromTree",
    value: function _removeFromTree(figure) {
      var _this8 = this;

      figure.edges().forEach(function (edge) {
        edge.vertices().forEach(function (v) {
          var found = _this8._vTree.at(v);
          if (found) {
            _this8._vTree.removeEdge(edge);
            if (found.edges.length == 0) {
              _this8._vTree.remove(v);
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