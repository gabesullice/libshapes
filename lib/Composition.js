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

var _GapFinder = require("./utils/GapFinder.js");

var _GapFinder2 = _interopRequireDefault(_GapFinder);

var _vertexTree = require("vertex-tree");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Composition = function () {
  function Composition() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$debug = _ref.debug,
        debug = _ref$debug === undefined ? false : _ref$debug,
        _ref$bounds = _ref.bounds,
        bounds = _ref$bounds === undefined ? [[0, 0], [100, 100]] : _ref$bounds,
        _ref$doSnap = _ref.doSnap,
        doSnap = _ref$doSnap === undefined ? true : _ref$doSnap,
        _ref$snapTolerance = _ref.snapTolerance,
        snapTolerance = _ref$snapTolerance === undefined ? 0.001 : _ref$snapTolerance,
        _ref$processGaps = _ref.processGaps,
        processGaps = _ref$processGaps === undefined ? false : _ref$processGaps;

    _classCallCheck(this, Composition);

    this._debug = debug;
    this.bounds.apply(this, bounds);
    this.snap(doSnap);
    this._doProcessGaps = processGaps;
    this.snapTolerance(snapTolerance);
    this._count = 0;
    this._figures = {};
    this._intersecting = [];
    this._gaps = [];
    this._vertexTwins = [];
    this._nonIntegrated = [];
    this._vTree = new _vertexTree.VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length()
    });
    this._subsectTree = new _vertexTree.VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length()
    });

    this._gapFinder = new _GapFinder2.default({
      vertexTree: this._vTree,
      subsectTree: this._subsectTree,
      debug: debug
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
    key: "snap",
    value: function snap(doSnap) {
      if (doSnap !== undefined) {
        this._doSnap = doSnap;
      }
      return this._doSnap;
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
    key: "processGaps",
    value: function processGaps(doProcess) {
      if (doProcess !== undefined) {
        this._doProcessGaps = doProcess;
      }
      return this._doProcessGaps;
    }
  }, {
    key: "debug",
    value: function debug(_debug) {
      if (_debug !== undefined) {
        this._debug = _debug;
        this._gapFinder.debug(_debug);
      }
      return this._debug;
    }
  }, {
    key: "log",
    value: function log() {
      var _console;

      if (this.debug()) (_console = console).log.apply(_console, arguments);
    }
  }, {
    key: "get",
    value: function get(id) {
      return this._figures.hasOwnProperty(id) ? this._figures[id] : null;
    }
  }, {
    key: "overlapping",
    value: function overlapping() {
      var _this = this;

      var pairs = [];
      var ids = Object.keys(this._figures);

      var _loop = function _loop() {
        var id0 = ids.pop();
        ids.forEach(function (id1) {
          if (figures.overlap(_this.get(id0), _this.get(id1))) {
            pairs.push({ a: id0, b: id1 });
          }
        });
      };

      while (ids.length > 0) {
        _loop();
      }
      return pairs;
    }
  }, {
    key: "gaps",
    value: function gaps() {
      return this._gaps;
    }
  }, {
    key: "floats",
    value: function floats() {
      var _this2 = this;

      return Object.keys(this._figures).filter(function (id) {
        return !_this2._coincident().some(function (pair) {
          return pair.a == id || pair.b == id;
        });
      });
    }
  }, {
    key: "nonIntegrated",
    value: function nonIntegrated() {
      var _this3 = this;

      return Object.keys(this._figures).filter(function (id) {
        return !_this3._checkIntegrated(id, _this3.get(id));
      });
    }
  }, {
    key: "_coincident",
    value: function _coincident() {
      var _this4 = this;

      var coincidentPairs = [];
      var ids = Object.keys(this._figures);

      var _loop2 = function _loop2() {
        var id0 = ids.pop();
        var fig0 = _this4.get(id0);
        ids.forEach(function (id1) {
          var fig1 = _this4.get(id1);
          if (figures.coincident(fig0, fig1)) {
            coincidentPairs.push({ a: id0, b: id1 });
          }
        });
      };

      while (ids.length > 0) {
        _loop2();
      }
      return coincidentPairs;
    }
  }, {
    key: "nonCoincident",
    value: function nonCoincident() {
      var _this5 = this;

      return Object.keys(this._figures).map(function (key) {
        return { id: key, figure: _this5._figures[key] };
      }).map(function (item) {
        item.edges = item.figure.edges();return item;
      }).filter(function (item) {
        return item.edges.some(function (e0) {
          var areCoincident = function areCoincident(e1) {
            return edges.coincident(e0, e1);
          };
          var left = _this5._subsectTree.at(e0.left());
          var right = _this5._subsectTree.at(e0.right());
          return left === undefined || !left.edges.some(areCoincident) || right === undefined || !right.edges.some(areCoincident);
        });
      }).map(function (item) {
        return item.id;
      });
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

    // Deprecated. Please use `Composition.moveTo()`.

  }, {
    key: "move",
    value: function move(id, target, options) {
      return this.moveTo.apply(this, arguments);
    }
  }, {
    key: "moveTo",
    value: function moveTo(id, target, options) {
      return this.transform(id, { position: target }, options);
    }
  }, {
    key: "rotateTo",
    value: function rotateTo(id, target, options) {
      return this.transform(id, { rotation: target }, options);
    }
  }, {
    key: "reflectOwnX",
    value: function reflectOwnX(id, options) {
      return this.transform(id, { reflection: { x: true } }, options);
    }
  }, {
    key: "reflectOwnY",
    value: function reflectOwnY(id, options) {
      return this.transform(id, { reflection: { y: true } }, options);
    }
  }, {
    key: "transform",
    value: function transform(id, _transform, options) {
      var _this6 = this;

      var start = void 0,
          final = void 0;

      var position = _transform.position,
          rotation = _transform.rotation,
          reflection = _transform.reflection;


      var transformOps = this._getOperations("transform").concat([{
        description: "Records the initial position of the figure",
        action: "transform",
        type: "singular",
        weight: -100,
        func: function func(id) {
          return start = _this6._figures[id].position();
        }
      }, {
        description: "Reflects the figure",
        action: "transform",
        type: "singular",
        weight: -0.1,
        func: function func(_, figure) {
          if (reflection !== undefined) {
            var x = reflection.x,
                y = reflection.y,
                _2 = reflection._;

            if (x) figure.reflectX();
            if (y) figure.reflectY();
            // In future, we may want reflection across arbitrary axes.
            //if (_) figure.reflect(_);
          }
        }
      }, {
        description: "Moves a figure to a specified position",
        action: "transform",
        type: "singular",
        weight: 0,
        func: function func(_, figure) {
          if (position !== undefined) figure.position(position);
        }
      }, {
        description: "Rotates the figure to a specified position",
        action: "transform",
        type: "singular",
        weight: 0,
        func: function func(_, figure) {
          if (rotation !== undefined) figure.rotation(rotation);
        }
      }, {
        description: "Handles snap for a moved figure",
        action: "transform",
        type: "singular",
        weight: 0,
        func: function func(id) {
          final = _this6._handleSnap(id, options);
        }
      }]);

      this._doOperations(id, this._figures[id], transformOps);

      var didSnap = this._doSnap && position !== undefined && (position[0] != final[0] || position[1] != final[1]);

      return {
        start: start,
        target: position,
        final: final,
        snapped: didSnap
      };
    }
  }, {
    key: "_doOperations",
    value: function _doOperations(id, figure, operations) {
      var _this7 = this;

      var organized = this._organizeOperations(operations);

      var _loop3 = function _loop3() {
        var batch = organized.shift();
        if (batch.hasOwnProperty("singular")) {
          batch.singular.forEach(function (operation) {
            try {
              operation.func(id, figure);
            } catch (e) {
              _this7.log("\"" + operation.description + "\" failed with exception:", e.message);
              if (_this7.debug()) throw e;
            }
          });
        }

        if (batch.hasOwnProperty("iterator")) {
          Object.keys(_this7._figures).forEach(function (fid) {
            var curr = _this7._figures[fid];
            if (id != fid) {
              batch.iterator.forEach(function (operation) {
                try {
                  operation.func({ id: id, figure: figure }, { id: fid, figure: curr });
                } catch (e) {
                  _this7.log("\"" + operation.description + "\" failed with exception:", e.message);
                  if (_this7.debug()) throw e;
                }
              });
            }
          });
        }
      };

      while (organized.length > 0) {
        _loop3();
      }
    }
  }, {
    key: "_organizeOperations",
    value: function _organizeOperations(operations) {
      // 1. Bundle the operations by weight into batches
      // 2. Sort the batches by weight
      // 3. Bundle operations within each set by their type
      var organized = operations.reduce(function (ops, operation) {
        var index = ops.findIndex(function (set) {
          return set[0].weight == operation.weight;
        });
        if (index !== -1) {
          ops[index].push(operation);
        } else {
          ops.push([operation]);
        }
        return ops;
      }, []).sort(function (a, b) {
        return a[0].weight < b[0].weight ? -1 : 1;
      }).map(function (set) {
        return set.reduce(function (ops, operation) {
          if (ops[operation.type] === undefined) {
            ops[operation.type] = [operation];
          } else {
            ops[operation.type].push(operation);
          }
          return ops;
        }, {});
      });
      return organized;
    }
  }, {
    key: "_getOperations",
    value: function _getOperations(action) {
      var _this8 = this;

      return [{
        description: "Adds a figure to the figures list",
        action: "insert",
        type: "singular",
        weight: -100,
        func: function func(id, figure) {
          return _this8._figures[id] = figure;
        }
      }, {
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -6,
        func: function func(id) {
          return _this8._handleSnap(id);
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "insert",
        type: "iterator",
        weight: -5,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this8._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "insert",
        type: "iterator",
        weight: -3,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this8._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: 0,
        func: function func(id, figure) {
          figure.edges().forEach(function (e) {
            return _this8._vTree.insertEdge(e, [id]);
          });
        }
      }, {
        description: "Removes any gaps overlapped by the inserted figure",
        action: "insert",
        type: "singular",
        weight: 1,
        func: function func(_, figure) {
          _this8._gaps = _this8._gaps.filter(function (gap) {
            return !figures.overlap(figure, gap);
          });
        }
      }, {
        description: "Find and process gaps on the figure's siblings",
        action: "insert",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          // Gets the figures siblings and processes them for new gaps.
          _this8._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          }).forEach(function (fid) {
            _this8._processGaps(fid, _this8.get(fid));
          });
        }
      }, {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          _this8._processGaps(id, figure);
        }
      }].concat(this._removeOperations(), this._transformOperations()).filter(function (elem) {
        return elem.action === action;
      });
    }
  }, {
    key: "_transformOperations",
    value: function _transformOperations() {
      var _this9 = this;

      var siblings = [];
      return [{
        description: "Removes the unmoved figures edges from the vertex tree",
        action: "transform",
        type: "singular",
        weight: -3,
        func: function func(id, figure) {
          return _this9._removeFromVTree(id, figure);
        }
      }, {
        description: "Register siblings of the figure that was removed",
        action: "transform",
        type: "singular",
        weight: -2,
        func: function func(id, figure) {
          // Gets the figures siblings and processes them for new gaps.
          siblings = _this9._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          });
        }
      }, {
        description: "Removes any subsection records created by a moved figure",
        action: "transform",
        type: "iterator",
        weight: -1,
        func: function func(a, b) {
          _this9._removeFromSubsectTree([a.id, b.id], figures.subsect(a.figure, b.figure));
        }
      }, {
        description: "Removes any gap records for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: function func(_, figure) {
          return _this9._gaps = _this9._gaps.filter(function (gap) {
            return !figures.coincident(figure, gap);
          });
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this9._removeIntersections(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this9._removeIntersections(id);
        }
      }, {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          figure.edges().forEach(function (e) {
            return _this9._vTree.insertEdge(e, [id]);
          });
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "transform",
        type: "iterator",
        weight: 2,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this9._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "transform",
        type: "iterator",
        weight: 3,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this9._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Removes any gaps overlapped by the moved figure",
        action: "transform",
        type: "singular",
        weight: 3,
        func: function func(_, figure) {
          _this9._gaps = _this9._gaps.filter(function (gap) {
            return !figures.overlap(figure, gap);
          });
        }
      }, {
        description: "Process gaps on the moved figures siblings",
        action: "transform",
        type: "singular",
        weight: 4,
        func: function func() {
          siblings.forEach(function (siblingId) {
            _this9._processGaps(siblingId, _this9._figures[siblingId]);
          });
        }
      }, {
        description: "Finds any gaps created by the moved figure",
        action: "transform",
        type: "singular",
        weight: 4,
        func: function func(id, figure) {
          return _this9._processGaps(id, figure);
        }
      }];
    }
  }, {
    key: "_removeOperations",
    value: function _removeOperations() {
      var _this10 = this;

      var siblings = [];
      return [{
        description: "Register siblings of the figure that was removed",
        action: "remove",
        type: "singular",
        weight: -1,
        func: function func(id, figure) {
          // Gets the figures siblings and processes them for new gaps.
          siblings = _this10._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          });
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this10._removeIntersections(id);
        }
      }, {
        description: "Removes any gap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(_, figure) {
          return _this10._gaps = _this10._gaps.filter(function (gap) {
            return !figures.coincident(figure, gap);
          });
        }
      }, {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: function func(a, b) {
          _this10._removeFromSubsectTree([a.id, b.id], figures.subsect(a.figure, b.figure), _this10._subsectTree);
        }
      }, {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(id, figure) {
          return _this10._removeFromVTree(id, figure);
        }
      }, {
        description: "Process gaps on the removed figures siblings",
        action: "remove",
        type: "singular",
        weight: 2,
        func: function func() {
          siblings.forEach(function (siblingId) {
            _this10._processGaps(siblingId, _this10._figures[siblingId]);
          });
        }
      }];
    }
  }, {
    key: "_processGaps",
    value: function _processGaps(id, figure) {
      if (!this.processGaps()) return;

      // If this figure intersects with another figure, do not find its gaps.
      if (this._intersecting.some(function (i) {
        return i.a == id || i.b == id;
      })) {
        return;
      }

      var found = this._gapFinder.gapsFrom(figure, this._gaps);
      this._gaps = found.reduce(function (gaps, gap0) {
        var index = gaps.findIndex(function (gap1) {
          return figures.overlap(gap0, gap1);
        });
        if (index !== -1) {
          if (gap0.edges().length > gaps[index].edges().length) {
            gaps.splice(index, 1, gap0);
          }
        } else {
          gaps.push(gap0);
        }
        return gaps;
      }, this._gaps || []);
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
      var _this11 = this;

      var solution = void 0;

      fig.vertices().forEach(function (v0) {
        var query = {
          origin: v0,
          radius: _this11._tolerance * _this11._bounds.length()
        };

        var result = _this11._vTree.find(query).map(function (item) {
          return item.vertex;
        });
        if (!result) return;

        solution = result.map(function (v1) {
          return {
            distance: vertex.distance(v0, v1),
            translation: [v1.x - v0.x, v1.y - v0.y]
          };
        }).reduce(function (solution, current) {
          return solution !== undefined && solution.distance < current.distance ? solution : current;
        }, solution);
      });

      if (solution && solution.distance > vertex.EPSILON) {
        return solution.translation;
      } else {
        return [0, 0];
      }
    }
  }, {
    key: "_removeIntersections",
    value: function _removeIntersections(id) {
      this._intersecting = this._intersecting.filter(function (i) {
        return !(i.a == id || i.b == id);
      });
    }
  }, {
    key: "_getFigureSiblingIds",
    value: function _getFigureSiblingIds(figure) {
      var _this12 = this;

      // Get all the items around figure.
      var items = figure.vertices().reduce(function (items, v) {
        var subsects = _this12._subsectTree.at(v);
        items = subsects ? items.concat(subsects) : items;
        var regulars = _this12._vTree.at(v);
        items = regulars ? items.concat(regulars) : items;
        return items;
      }, []);

      // 1. Extract the tags (which are figure ids) from each item.
      // 2. Deduplicate the fids.
      var fids = items.map(function (item) {
        return item.tags;
      }).reduce(function (fids, tags) {
        return tags.reduce(function (fids, tag) {
          if (!fids.some(function (fid) {
            return fid == tag;
          })) fids.push(tag);
          return fids;
        }, fids);
      }, []);

      // Filter out figure ids which aren't siblings of the given figure.
      return fids.filter(function (fid) {
        return figures.siblings(figure, _this12._figures[fid]);
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
    key: "_removeFromVTree",
    value: function _removeFromVTree(id, figure) {
      this._removeFromTree([id], figure.edges(), this._vTree);
    }
  }, {
    key: "_removeFromSubsectTree",
    value: function _removeFromSubsectTree(ids, sections) {
      this._removeFromTree(ids, sections, this._subsectTree);
    }
  }, {
    key: "_removeFromTree",
    value: function _removeFromTree(ids, edges, tree) {
      edges.forEach(function (edge) {
        tree.removeEdge(edge);
      });
      edges.forEach(function (e) {
        e.vertices().forEach(function (v) {
          var result = tree.at(v);
          if (result) ids.forEach(function (id) {
            return result.removeTag(id);
          });
        });
      });
    }
  }, {
    key: "_checkIntegrated",
    value: function _checkIntegrated(id, figure) {
      var _this13 = this;

      var vertices = figure.vertices();
      return vertices.every(function (v) {
        var item = _this13._vTree.at(v);
        if (item) {
          return item.tags.length > 1;
        }
        return false;
      });
    }
  }]);

  return Composition;
}();

exports.default = Composition;