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
    this._overlapping = [];
    this._intersecting = [];
    this._gaps = [];
    this._floats = [];
    this._coincidentPairs = [];
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
      return this._overlapping;
    }
  }, {
    key: "gaps",
    value: function gaps() {
      return this._gaps;
    }
  }, {
    key: "floats",
    value: function floats() {
      return this._floats;
    }
  }, {
    key: "nonIntegrated",
    value: function nonIntegrated() {
      return this._nonIntegrated;
    }
  }, {
    key: "nonCoincident",
    value: function nonCoincident() {
      var _this = this;

      return Object.keys(this._figures).map(function (key) {
        return { id: key, figure: _this._figures[key] };
      }).map(function (item) {
        item.edges = item.figure.edges();return item;
      }).filter(function (item) {
        return item.edges.some(function (e0) {
          var areCoincident = function areCoincident(e1) {
            return edges.coincident(e0, e1);
          };
          var left = _this._subsectTree.at(e0.left());
          var right = _this._subsectTree.at(e0.right());
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
    key: "transform",
    value: function transform(id, _transform, options) {
      var _this2 = this;

      var start = void 0,
          final = void 0;

      var position = _transform.position,
          rotation = _transform.rotation;


      var transformOps = this._getOperations("transform").concat([{
        description: "Records the initial position of the figure",
        action: "transform",
        type: "singular",
        weight: -100,
        func: function func(id) {
          return start = _this2._figures[id].position();
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
          final = _this2._handleSnap(id, options);
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
      var _this3 = this;

      var organized = this._organizeOperations(operations);

      var _loop = function _loop() {
        var batch = organized.shift();
        if (batch.hasOwnProperty("singular")) {
          batch.singular.forEach(function (operation) {
            try {
              operation.func(id, figure);
            } catch (e) {
              _this3.log("\"" + operation.description + "\" failed with exception:", e.message);
              if (_this3.debug()) throw e;
            }
          });
        }

        if (batch.hasOwnProperty("iterator")) {
          Object.keys(_this3._figures).forEach(function (fid) {
            var curr = _this3._figures[fid];
            if (id != fid) {
              batch.iterator.forEach(function (operation) {
                try {
                  operation.func({ id: id, figure: figure }, { id: fid, figure: curr });
                } catch (e) {
                  _this3.log("\"" + operation.description + "\" failed with exception:", e.message);
                  if (_this3.debug()) throw e;
                }
              });
            }
          });
        }
      };

      while (organized.length > 0) {
        _loop();
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
      var _this4 = this;

      return [{
        description: "Adds a figure to the figures list",
        action: "insert",
        type: "singular",
        weight: -100,
        func: function func(id, figure) {
          return _this4._figures[id] = figure;
        }
      }, {
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -6,
        func: function func(id) {
          return _this4._handleSnap(id);
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "insert",
        type: "iterator",
        weight: -5,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this4._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores overlapping figures",
        action: "insert",
        type: "iterator",
        weight: -4,
        func: function func(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this4._overlapping.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "insert",
        type: "iterator",
        weight: -3,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this4._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Keeps a record of coincident pairs",
        action: "insert",
        type: "iterator",
        weight: -1,
        func: function func(a, b) {
          if (figures.coincident(a.figure, b.figure)) {
            _this4._coincidentPairs.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Check and records floats for inserted figures",
        action: "insert",
        type: "singular",
        weight: -0.9,
        func: function func(id, figure) {
          // if the inserted is not paired with anything, it's a float
          // if it is paired with something, it's not a float
          // remove any of it's new pairs from floats
          var isInPairs = function isInPairs(id, pairs) {
            return pairs.some(function (pair) {
              return pair.a == id || pair.b == id;
            });
          };

          if (!isInPairs(id, _this4._coincidentPairs)) {
            _this4._floats.push(id);
          } else {
            _this4._floats = _this4._floats.filter(function (fid) {
              return !isInPairs(fid, _this4._coincidentPairs);
            });
          }
        }
      }, {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: 0,
        func: function func(id, figure) {
          figure.edges().forEach(function (e) {
            return _this4._vTree.insertEdge(e, [id]);
          });
        }
      }, {
        description: "Records if a figure is not fully integrated (all of its vertices are shared)",
        action: "insert",
        type: "singular",
        weight: 1,
        func: function func(id, figure) {
          if (!_this4._checkIntegrated(id, figure)) {
            _this4._nonIntegrated.push(id);
          }

          figure.vertices().map(function (v) {
            return _this4._vTree.at(v);
          }).filter(function (item) {
            return item !== undefined;
          }).filter(function (item) {
            return item.tags.length > 1;
          }).reduce(function (tags, item) {
            return tags.concat(item.tags);
          }, []).filter(function (tag) {
            return tag != id;
          }).reduce(function (dedupe, tag) {
            return dedupe.findIndex(function (id) {
              return tag == id;
            }) === -1 ? dedupe.concat(tag) : dedupe;
          }, []).forEach(function (tag) {
            var twin = { a: id, b: tag };
            if (_this4._vertexTwins.findIndex(function (compare) {
              return compare.a == twin.a && compare.b == twin.b || compare.a == twin.b && compare.b == twin.a;
            }) === -1) {
              _this4._vertexTwins.push(twin);
            }
            if (_this4._checkIntegrated(tag, _this4.get(tag))) {
              _this4._nonIntegrated = _this4._nonIntegrated.filter(function (id) {
                return id != tag;
              });
            } else {
              if (_this4._nonIntegrated.findIndex(function (id) {
                return tag == id;
              }) === -1) {
                _this4._nonIntegrated.push(tag);
              }
            }
          });
        }
      }, {
        description: "Removes any gaps overlapped by the inserted figure",
        action: "insert",
        type: "singular",
        weight: 1,
        func: function func(_, figure) {
          _this4._gaps = _this4._gaps.filter(function (gap) {
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
          _this4._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          }).forEach(function (fid) {
            _this4._processGaps(fid, _this4.get(fid));
          });
        }
      }, {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          _this4._processGaps(id, figure);
        }
      }].concat(this._removeOperations(), this._transformOperations()).filter(function (elem) {
        return elem.action === action;
      });
    }
  }, {
    key: "_transformOperations",
    value: function _transformOperations() {
      var _this5 = this;

      var siblings = [];
      return [{
        description: "Removes the unmoved figures edges from the vertex tree",
        action: "transform",
        type: "singular",
        weight: -3,
        func: function func(id, figure) {
          return _this5._removeFromTree(id, figure);
        }
      }, {
        description: "Register siblings of the figure that was removed",
        action: "transform",
        type: "singular",
        weight: -2,
        func: function func(id, figure) {
          // Gets the figures siblings and processes them for new gaps.
          siblings = _this5._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          });
        }
      }, {
        description: "Removes any subsection records created by a moved figure",
        action: "transform",
        type: "iterator",
        weight: -1,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this5._subsectTree.removeEdge(section);
          });
        }
      }, {
        description: "Removes any overlap records for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: function func(id) {
          return _this5._removeOverlaps(id);
        }
      }, {
        description: "Removes any gap records for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: function func(_, figure) {
          return _this5._gaps = _this5._gaps.filter(function (gap) {
            return !figures.coincident(figure, gap);
          });
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this5._removeIntersections(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: function func(id) {
          return _this5._removeIntersections(id);
        }
      }, {
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "transform",
        type: "singular",
        weight: 1.0,
        func: function func(id) {
          var data = _this5._coincidentPairs.reduce(function (data, pair) {
            if (pair.a == id || pair.b == id) {
              var counterpart = pair.a == id ? pair.b : pair.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(pair);
              data.unpaired = data.unpaired.filter(function (fid) {
                return !(pair.a == fid || pair.b == fid);
              });
            }
            return data;
          }, { unpaired: [], remaining: [] });

          _this5._coincidentPairs = data.remaining;
          _this5._floats = _this5._floats.concat(data.unpaired);
        }
      }, {
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "transform",
        type: "iterator",
        weight: 1.1,
        func: function func(a, b) {
          if (figures.coincident(a.figure, b.figure)) {
            _this5._coincidentPairs.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Keeps record of any floating figures",
        action: "transform",
        type: "singular",
        weight: 1.2,
        func: function func(id, figure) {
          // if the inserted is not paired with anything, it's a float
          // if it is paired with something, it's not a float
          // remove any of it's new pairs from floats
          var isInPairs = function isInPairs(id, pairs) {
            return pairs.some(function (pair) {
              return pair.a == id || pair.b == id;
            });
          };

          if (!isInPairs(id, _this5._coincidentPairs)) {
            _this5._floats.push(id);
          } else {
            _this5._floats = _this5._floats.filter(function (fid) {
              return !isInPairs(fid, _this5._coincidentPairs);
            });
          }
        }
      }, {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          figure.edges().forEach(function (e) {
            return _this5._vTree.insertEdge(e, [id]);
          });
        }
      }, {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "transform",
        type: "iterator",
        weight: 2,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this5._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }
      }, {
        description: "Finds and stores instersecting figures",
        action: "transform",
        type: "iterator",
        weight: 3,
        func: function func(a, b) {
          if (figures.intersect(a.figure, b.figure)) {
            _this5._intersecting.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Finds and stores overlapping figures",
        action: "transform",
        type: "iterator",
        weight: 3,
        func: function func(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this5._overlapping.push({ a: a.id, b: b.id });
          }
        }
      }, {
        description: "Removes old vertex twin records and makes new ones if needed",
        action: "transform",
        type: "singular",
        weight: 2.9,
        func: function func(id, figure) {
          var data = _this5._vertexTwins.reduce(function (data, twin) {
            if (twin.a == id || twin.b == id) {
              var counterpart = twin.a == id ? twin.b : twin.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(twin);
            }
            return data;
          }, { unpaired: [], remaining: [] });

          data.unpaired.filter(function (tag) {
            return !_this5._checkIntegrated(tag, _this5.get(tag));
          }).forEach(function (tag) {
            if (!_this5._nonIntegrated.some(function (fid) {
              return fid == tag;
            })) {
              _this5._nonIntegrated.push(tag);
            } else {
              _this5._nonIntegrated.filter(function (fid) {
                return fid != tag;
              });
            }
          });

          _this5._vertexTwins = data.remaining;
        }
      }, {
        description: "Records if a figure is not fully integrated (all of its vertices are shared)",
        action: "transform",
        type: "singular",
        weight: 3,
        func: function func(id, figure) {
          if (!_this5._checkIntegrated(id, figure)) {
            _this5._nonIntegrated.push(id);
          } else {
            _this5._nonIntegrated = _this5._nonIntegrated.filter(function (fid) {
              return fid != id;
            });
          }

          figure.vertices().map(function (v) {
            return _this5._vTree.at(v);
          }).filter(function (item) {
            return item !== undefined;
          }).filter(function (item) {
            return item.tags.length > 1;
          }).reduce(function (tags, item) {
            return tags.concat(item.tags);
          }, []).filter(function (tag) {
            return tag != id;
          }).reduce(function (dedupe, tag) {
            return dedupe.findIndex(function (id) {
              return tag == id;
            }) === -1 ? dedupe.concat(tag) : dedupe;
          }, []).forEach(function (tag) {
            var twin = { a: id, b: tag };
            if (_this5._vertexTwins.findIndex(function (compare) {
              return compare.a == twin.a && compare.b == twin.b || compare.a == twin.b && compare.b == twin.a;
            }) === -1) {
              _this5._vertexTwins.push(twin);
            }
            if (_this5._checkIntegrated(tag, _this5.get(tag))) {
              _this5._nonIntegrated = _this5._nonIntegrated.filter(function (id) {
                return id != tag;
              });
            } else {
              if (_this5._nonIntegrated.findIndex(function (id) {
                return tag == id;
              }) === -1) {
                _this5._nonIntegrated.push(tag);
              }
            }
          });
        }
      }, {
        description: "Removes any gaps overlapped by the moved figure",
        action: "transform",
        type: "singular",
        weight: 3,
        func: function func(_, figure) {
          _this5._gaps = _this5._gaps.filter(function (gap) {
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
            _this5._processGaps(siblingId, _this5._figures[siblingId]);
          });
        }
      }, {
        description: "Finds any gaps created by the moved figure",
        action: "transform",
        type: "singular",
        weight: 4,
        func: function func(id, figure) {
          return _this5._processGaps(id, figure);
        }
      }];
    }
  }, {
    key: "_removeOperations",
    value: function _removeOperations() {
      var _this6 = this;

      var siblings = [];
      return [{
        description: "Register siblings of the figure that was removed",
        action: "remove",
        type: "singular",
        weight: -1,
        func: function func(id, figure) {
          // Gets the figures siblings and processes them for new gaps.
          siblings = _this6._getFigureSiblingIds(figure).filter(function (fid) {
            return fid != id;
          });
        }
      }, {
        description: "Removes any overlap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this6._removeOverlaps(id);
        }
      }, {
        description: "Removes any intersection records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(id) {
          return _this6._removeIntersections(id);
        }
      }, {
        description: "Removes any gap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: function func(_, figure) {
          return _this6._gaps = _this6._gaps.filter(function (gap) {
            return !figures.coincident(figure, gap);
          });
        }
      }, {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: function func(a, b) {
          figures.subsect(a.figure, b.figure).forEach(function (section) {
            _this6._subsectTree.removeEdge(section);
          });
        }
      }, {
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(id, figure) {
          var data = _this6._coincidentPairs.reduce(function (data, pair) {
            if (pair.a == id || pair.b == id) {
              var counterpart = pair.a == id ? pair.b : pair.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(pair);
              data.unpaired = data.unpaired.filter(function (fid) {
                return !(pair.a == fid || pair.b == fid);
              });
            }
            return data;
          }, { unpaired: [], remaining: [] });

          _this6._coincidentPairs = data.remaining;
          _this6._floats = _this6._floats.concat(data.unpaired);
        }
      }, {
        description: "Removes the removed figure id from the float record",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(id) {
          _this6._floats = _this6._floats.filter(function (fid) {
            return fid != id;
          });
        }
      }, {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: function func(id, figure) {
          return _this6._removeFromTree(id, figure);
        }
      }, {
        description: "Removes old vertex twin records and makes new ones if needed",
        action: "remove",
        type: "singular",
        weight: 2,
        func: function func(id, figure) {
          var data = _this6._vertexTwins.reduce(function (data, twin) {
            if (twin.a == id || twin.b == id) {
              var counterpart = twin.a == id ? twin.b : twin.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(twin);
            }
            return data;
          }, { unpaired: [], remaining: [] });

          data.unpaired.filter(function (tag) {
            return !_this6._checkIntegrated(tag, _this6.get(tag));
          }).forEach(function (tag) {
            if (!_this6._nonIntegrated.some(function (fid) {
              return fid == tag;
            })) {
              _this6._nonIntegrated.push(tag);
            } else {
              _this6._nonIntegrated.filter(function (fid) {
                return fid != tag;
              });
            }
          });

          _this6._nonIntegrated = _this6._nonIntegrated.filter(function (fid) {
            return fid != id;
          });
          _this6._vertexTwins = data.remaining;
        }
      }, {
        description: "Process gaps on the removed figures siblings",
        action: "remove",
        type: "singular",
        weight: 2,
        func: function func() {
          siblings.forEach(function (siblingId) {
            _this6._processGaps(siblingId, _this6._figures[siblingId]);
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
      var _this7 = this;

      var solution = void 0;

      fig.vertices().forEach(function (v0) {
        var query = {
          origin: v0,
          radius: _this7._tolerance * _this7._bounds.length()
        };

        var result = _this7._vTree.find(query).map(function (item) {
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
    key: "_getFigureSiblingIds",
    value: function _getFigureSiblingIds(figure) {
      var _this8 = this;

      // Get all the items around figure.
      var items = figure.vertices().reduce(function (items, v) {
        var subsects = _this8._subsectTree.at(v);
        items = subsects ? items.concat(subsects) : items;
        var regulars = _this8._vTree.at(v);
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
        return figures.siblings(figure, _this8._figures[fid]);
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
    key: "_removeFromTree",
    value: function _removeFromTree(id, figure) {
      var _this9 = this;

      figure.edges().forEach(function (edge) {
        _this9._vTree.removeEdge(edge);
      });
      figure.vertices().forEach(function (v) {
        var result = _this9._vTree.at(v);
        if (result) result.removeTag(id);
      });
    }
  }, {
    key: "_checkIntegrated",
    value: function _checkIntegrated(id, figure) {
      var _this10 = this;

      var vertices = figure.vertices();
      return vertices.every(function (v) {
        var item = _this10._vTree.at(v);
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