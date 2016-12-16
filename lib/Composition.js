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

var _vertexTree2 = _interopRequireDefault(_vertexTree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    this._vTree = new _vertexTree2.default({
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
      //this._handleSnap(id, options);
      this._iterateFigures(id);
      return id;
    }
  }, {
    key: "remove",
    value: function remove(id) {
      this._removeOverlaps(id);
      return delete this._figures[id];
    }
  }, {
    key: "get",
    value: function get(id) {
      return this._figures.hasOwnProperty(id) ? this._figures[id] : null;
    }
  }, {
    key: "move",
    value: function move(id, translation, options) {
      this._removeOverlaps(id);
      this._figures[id].position(translation);
      this._handleSnap(id, options);
      this._iterateFigures(id);
      return this._figures[id].position();
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
    }
  }, {
    key: "_iterateFigures",
    value: function _iterateFigures(id) {
      var figs = this._figures;
      var iteratorFuncs = this._getIterationFuncs();
      for (var k in figs) {
        iteratorFuncs.overlap({ id: k, figure: figs[k] }, { id: id, figure: figs[id] });
        for (var fid in iteratorFuncs) {
          //iteratorFuncs[fid]({id: k, figure: figs[k]}, {id: id, figure: figs[id]});
        }
      }
    }
  }, {
    key: "_getIterationFuncs",
    value: function _getIterationFuncs() {
      var _this = this;

      return {
        overlap: function overlap(a, b) {
          if (figures.overlap(a.figure, b.figure)) {
            _this._overlapping.push({ a: a.id, b: b.id });
          }
        },
        gaps: function () {
          _this._gaps = [];
          return function (a, b) {
            var edgesA = a.figure.edges(),
                edgesB = b.figure.edges();
            for (var i in edgesA) {
              for (var j in edgesB) {
                var sections = [];
                if (edges.coincident(edgesA[i], edgesB[j])) {
                  sections = edges.subsect(edgesA[i], edgesB[j]);
                } else {
                  sections = [edgesA[i]];
                }
                sections.forEach(function (section) {
                  if (_this._solitaryEdge(section)) {
                    _this._gaps.push(_this._traceGap(section));
                  }
                });
              }
            }
          };
        }()
      };
    }
  }, {
    key: "_addOverlaps",
    value: function _addOverlaps(id) {}
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
  }]);

  return Composition;
}();

exports.default = Composition;