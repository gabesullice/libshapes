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

var _vertexTree = require("vertex-tree");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Composition = function () {
  function Composition(options) {
    _classCallCheck(this, Composition);

    var bounds = [[0, 0], [100, 100]];
    var doSnap = true;
    var snapTolerance = 0.001;
    if (options !== undefined) {
      if (options.hasOwnProperty('bounds')) bounds = options.bounds;
      if (options.hasOwnProperty('snap')) doSnap = options.snap;
      if (options.hasOwnProperty('snapTolerance')) snapTolerance = options.snapTolerance;
    }
    this.bounds.apply(this, bounds);
    this._doSnap = doSnap;
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
      this._processGaps(figure);
      this._addToTree(figure);
      this._handleSnap(id, options);
      this._iterateFigures(id, "insert");
      return id;
    }
  }, {
    key: "_processGaps",
    value: function _processGaps(figure) {
      var noncoincident = this._getNonCoincidentEdges(figure.edges());
    }

    // Returns a list of edges which are not coincident with any other edge.

  }, {
    key: "_getNonCoincidentEdges",
    value: function _getNonCoincidentEdges(edges) {
      var _this = this;

      var lonely = edges.reduce(function (lonely, edge) {
        // Collect all edges around the vertices of edge.
        var possibles = edge.vertices().reduce(function (possibles, v) {
          var regular = _this._vTree.at(v);
          var subsected = _this._subsectTree.at(v);
          // If both have results...
          if (regular && subsected) {
            // Add their edges to possibles.
            return possibles.concat(regular.edges, subsected.edges);
          } else if (regular ^ subsected) {
            // If either one has a result, add the appropiate edges onto possibles.
            return regular ? possibles.concat(regular.edges) : possible.concat(subsected.edges);
          } else {
            // Just return what we already have.
            return possibles;
          }
        }, []);

        // Curry the edges.coincident function so that it can accept just one
        // edge to compare against for coincidence against edge.
        var coincident = function coincident(compare) {
          edges.coincident(edge, compare);
        };

        // If none of the possibles are coincident then we have a completely
        // non-coincident edge which we know implies a gap.
        if (!possibles.some(coincident)) {
          lonely.push(edge);
        }

        return lonely;
      }, []);
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
      return this._gaps;
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