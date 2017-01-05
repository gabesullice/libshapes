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
  function Composition(options) {
    _classCallCheck(this, Composition);

    var debug = false;
    var bounds = [[0, 0], [100, 100]];
    var doSnap = true;
    var snapTolerance = 0.001;
    var processGaps = false;
    if (options !== undefined) {
      if (options.hasOwnProperty('debug')) debug = options.debug;
      if (options.hasOwnProperty('bounds')) bounds = options.bounds;
      if (options.hasOwnProperty('snap')) doSnap = options.snap;
      if (options.hasOwnProperty('snapTolerance')) snapTolerance = options.snapTolerance;
      if (options.hasOwnProperty('processGaps')) processGaps = options.processGaps;
    }
    this._debug = debug;
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
    value: function move(id, target, options) {
      return this.transform(id, { position: target }, options);
    }
  }, {
    key: "transform",
    value: function transform(id, _transform, options) {
      var _this = this;

      var start = void 0,
          final = void 0;

      var position = _transform.position;


      var transformOps = this._getOperations("transform").concat([{
        description: "Records the initial position of the figure",
        action: "transform",
        type: "singular",
        weight: -3,
        func: function func(id) {
          return start = _this._figures[id].position();
        }
      }, {
        description: "Moves a figure to a specified position",
        action: "transform",
        type: "singular",
        weight: -1,
        func: function func(_, figure) {
          if (position !== undefined) figure.position(position);
        }
      }, {
        description: "Handles snap for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: function func(id) {
          final = _this._handleSnap(id, options);
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
      var _this2 = this;

      this._organizeOperations(operations).forEach(function (set) {
        if (set.hasOwnProperty("singular")) {
          set.singular.forEach(function (operation) {
            try {
              operation.func(id, figure);
            } catch (e) {
              console.log("\"" + operation.description + "\" failed with exception:", e.message);
              throw e;
            }
          });
        }

        if (set.hasOwnProperty("iterator")) {
          Object.keys(_this2._figures).forEach(function (fid) {
            var curr = _this2._figures[fid];
            if (id != fid) {
              set.iterator.forEach(function (operation) {
                try {
                  operation.func({ id: id, figure: figure }, { id: fid, figure: curr });
                } catch (e) {
                  console.log("\"" + operation.description + "\" failed with exception:", e.message);
                  throw e;
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
      var _this3 = this;

      return [{
        description: "Adds a figure to the figures list",
        action: "insert",
        type: "singular",
        weight: -100,
        func: function func(id, figure) {
          return _this3._figures[id] = figure;
        }
      }, {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: -1,
        func: function func(_, figure) {
          return _this3._addToTree(figure);
        }
      }, {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 0,
        func: function func(id, figure) {
          return _this3._processGaps(id, figure);
        }
      }, {
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -2,
        func: function func(id) {
          return _this3._handleSnap(id);
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "insert",
        type: "iterator",
        weight: -5,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this3._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores overlapping figures",
        action: "insert",
        type: "iterator",
        weight: -4,
        func: function func(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this3._overlapping.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "insert",
        type: "iterator",
        weight: -3,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this3._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Removes any overlap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this3._removeOverlaps(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this3._removeIntersections(id);
        }
      }, {
        description: "Removes any gap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this3._removeGaps(id);
        }
      }, {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this3._subsectTree.removeEdge(section);
          });
        }
      }, {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(_, figure) {
          return _this3._removeFromTree(figure);
        }
      }, {
        description: "Removes any overlap records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this3._removeOverlaps(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this3._removeIntersections(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this3._removeIntersections(id);
        }
      }, {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(_, figure) {
          return _this3._addToTree(figure);
        }
      }, {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 0,
        func: function func(_, figure) {
          return _this3._addToTree(figure);
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this3._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores overlapping figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: function func(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this3._overlapping.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this3._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Removes the unmoved figures edges from the vertex tree",
        action: "transform",
        type: "singular",
        weight: -2,
        func: function func(id) {
          return _this3._removeFromTree(_this3._figures[id]);
        }
      }].filter(function (elem) {
        return elem.action === action;
      });
    }
  }, {
    key: "_processGaps",
    value: function _processGaps(id, figure) {
      if (!this._doProcessGaps) return;

      // If this figure intersects with another figure, do not find its gaps.
      if (this._intersecting.some(function (i) {
        return i.a == id || i.b == id;
      })) {
        return;
      }

      this._gaps = this._gaps.concat(this._gapFinder.gapsFrom(figure, this._gaps));
    }
  }, {
    key: "_removeGaps",
    value: function _removeGaps(removedId) {
      var _this4 = this;

      if (!this._doProcessGaps) return;

      var removed = this._figures[removedId];

      this._gaps.forEach(function (gap, index) {
        if (gap.edges().some(function (gapEdge, index) {
          return removed.edges().some(function (removeEdge) {
            return edges.coincident(gapEdge, removeEdge);
          });
        })) {
          delete _this4._gaps[index];
          _this4._processGaps("gap", gap);
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
      var _this5 = this;

      var solution = void 0;

      fig.vertices().forEach(function (v0) {
        var query = {
          origin: v0,
          radius: _this5._tolerance * _this5._bounds.length()
        };

        var result = _this5._vTree.find(query).map(function (item) {
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
    key: "_removeOverlaps",
    value: function _removeOverlaps(id) {
      this._overlapping = this._overlapping.filter(function (o) {
        return !(o.a == id || o.b == id);
      });
    }
  }, {
    key: "_removeIntersections",
    value: function _removeIntersections(id) {
      this._intersecting = this._intersecting.filter(function (i) {
        return !(i.a == id || i.b == id);
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
      var _this6 = this;

      figure.edges().forEach(function (e) {
        return _this6._vTree.insertEdge(e, [figure.id]);
      });
    }
  }, {
    key: "_removeFromTree",
    value: function _removeFromTree(figure) {
      var _this7 = this;

      figure.edges().forEach(function (edge) {
        _this7._vTree.removeEdge(edge);
        edge.vertices().forEach(function (v) {
          var result = _this7._vTree.at(v);
          if (result) result.removeTag(figure.id);
        });
      });
    }
  }]);

  return Composition;
}();

exports.default = Composition;