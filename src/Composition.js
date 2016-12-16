import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";
import VertexTree from "vertex-tree";

export default class Composition {

  constructor(options) {
    let bounds = [[0,0], [100,100]];
    let doSnap = true;
    let snapTolerance = 0.001;
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
    this._vTree = new VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length(),
    });
  }

  figures() {
    return this._figures;
  }

  bounds(b0, b1) {
    if (b0 !== undefined && b1 !== undefined) {
      this._bounds = new edges.Edge([b0, b1]);
    }
    const l = this._bounds.left(), r = this._bounds.right();
    const ret = [[l.x, l.y], [r.x, r.y]];
    return ret;
  }

  snapTolerance(tolerance) {
    if (tolerance !== undefined) {
      this._tolerance = tolerance;
    }
    return this._tolerance;
  }

  add(figure, options) {
    const id = this._getID();
    this._figures[id] = figure;
    //this._handleSnap(id, options);
    this._iterateFigures(id);
    return id;
  }

  remove(id) {
    this._removeOverlaps(id);
    return delete this._figures[id];
  }

  get(id) {
    return (this._figures.hasOwnProperty(id)) ? this._figures[id] : null;
  }

  move(id, translation, options) {
    this._removeOverlaps(id);
    this._figures[id].position(translation);
    this._handleSnap(id, options);
    this._iterateFigures(id);
    return this._figures[id].position();
  }

  overlapping() {
    return this._overlapping;
  }

  gaps() {
    return this._gaps;
  }

  _handleSnap(id, options) {
    let doSnap = this._doSnap;
    if (options !== undefined) {
      if (options.hasOwnProperty('snap')) doSnap = options.snap;
    }
    if (doSnap) {
      this._figures[id].translate(this._calculateSnap(this._figures[id]));
    }
  }

  _iterateFigures(id) {
    const figs = this._figures;
    const iteratorFuncs = this._getIterationFuncs();
    for (var k in figs) {
      iteratorFuncs.overlap({id: k, figure: figs[k]}, {id: id, figure: figs[id]});
      for (var fid in iteratorFuncs) {
        //iteratorFuncs[fid]({id: k, figure: figs[k]}, {id: id, figure: figs[id]});
      }
    }
  }

  _getIterationFuncs() {
    return {
      overlap: (a, b) => {
        if (figures.overlap(a.figure, b.figure)) {
          this._overlapping.push({a: a.id, b: b.id});
        }
      },
      gaps: (() => {
        this._gaps = [];
        return (a, b) => {
          const edgesA = a.figure.edges(), edgesB = b.figure.edges();
          for (var i in edgesA) {
            for (var j in edgesB) {
              let sections = [];
              if (edges.coincident(edgesA[i], edgesB[j])) {
                sections = edges.subsect(edgesA[i], edgesB[j]);
              } else {
                sections = [edgesA[i]];
              }
              sections.forEach(section => {
                if (this._solitaryEdge(section)) {
                  this._gaps.push(this._traceGap(section));
                }
              });
            }
          }
        }
      })()
    };
  }

  _removeOverlaps(id) {
    this._overlapping = this._overlapping.filter(overlap => {
      return !(overlap.a == id || overlap.b == id);
    });
  }

  _calculateSnap(fig) {
    const figs = this._figures;
    const tolerance = this._tolerance * (vertex.distance(this._bounds.left(), this._bounds.right()));
    const verticesA = fig.vertices();
    for (var i in verticesA) {
      for (var j in figs) {
        const verticesB = figs[j].vertices();
        for (var k in verticesB) {
          const va = verticesA[i], vb = verticesB[k];
          const vd = vertex.distance(va, vb);
          if (vd > vertex.EPSILON && vd < tolerance) {
            return [vb.x - va.x, vb.y - va.y];
          }
        }
      }
    }
    return [0, 0];
  }

  _getID() {
    const id = "fig-" + this._count;
    this._count++;
    return id;
  }

}
