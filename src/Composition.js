import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";
import {VertexTree} from "vertex-tree";

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
    this._subsectTree = new VertexTree({
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
    this._processGaps(figure);
    this._addToTree(figure);
    this._handleSnap(id, options);
    this._iterateFigures(id, "insert");
    return id;
  }

  _processGaps(figure) {
    const noncoincident = this._getNonCoincidentEdges(figure.edges());
  }

  // Returns a list of edges which are not coincident with any other edge.
  _getNonCoincidentEdges(edges) {
    const lonely = edges.reduce((lonely, edge) => {
      // Collect all edges around the vertices of edge.
      const possibles = edge.vertices().reduce((possibles, v) => {
        const regular = this._vTree.at(v);
        const subsected = this._subsectTree.at(v);
        // If both have results...
        if (regular && subsected) {
          // Add their edges to possibles.
          return possibles.concat(regular.edges, subsected.edges);
        } else if (regular ^ subsected) {
          // If either one has a result, add the appropiate edges onto possibles.
          return (regular) ? possibles.concat(regular.edges) : possible.concat(subsected.edges);
        } else {
          // Just return what we already have.
          return possibles;
        }
      }, []);


      // Curry the edges.coincident function so that it can accept just one
      // edge to compare against for coincidence against edge.
      const coincident = (compare) => {
        edges.coincident(edge, compare);
      }

      // If none of the possibles are coincident then we have a completely
      // non-coincident edge which we know implies a gap.
      if (!possibles.some(coincident)) {
        lonely.push(edge);
      }

      return lonely;
    }, []);
  }

  _getFigureSiblings(figure) {
    // walk around the figure, find sibling figures.
    return figure.vertices().reduce((siblings, v) => {
      const items = this._vTree.at(v);
      if (items) {
        siblings = items.tags
          .filter(tag => { return tag != figure.id; }) // no the current figure
          .map(fid => { return this.get(fid); }) // map ids to real objects
          .reduce((siblings, fig) => {
            // put them in our collection of figures unless it's already there.
            if (!siblings.find(item => { item.id == fig.id })) {
              siblings.push(fig);
            }
          }, siblings);
      }
      return siblings;
    }, []);
  }

  remove(id) {
    if (this._figures.hasOwnProperty(id)) {
      this._removeOverlaps(id);
      this._iterateFigures(id, "remove");
      this._removeFromTree(this._figures[id]);
      return delete this._figures[id];
    }
    return false;
  }

  get(id) {
    return (this._figures.hasOwnProperty(id)) ? this._figures[id] : null;
  }

  move(id, translation, options) {
    this._removeFromTree(this._figures[id]);
    const start = this._figures[id].position();
    const target = this._figures[id].position(translation);
    const final = this._handleSnap(id, options);
    this._removeOverlaps(id);
    this._addToTree(this._figures[id]);
    this._iterateFigures(id, "insert");
    return {
      start, target, final,
      snapped: (this._doSnap && (target[0] != final[0] || target[1] != final[1])),
    };
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
    return this._figures[id].position();
  }

  _iterateFigures(id, op) {
    const figs = this._figures;
    let iteratorFuncs = [];
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
          iteratorFuncs[funcName](
            {id: k, figure: figs[k]},
            {id: id, figure: figs[id]}
          );
        }
      }
    }
  }

  _getInsertIteratorFuncs() {
    return {
      overlap: (a, b) => {
        if (figures.overlap(a.figure, b.figure)) {
          this._overlapping.push({a: a.id, b: b.id});
        }
      },
      subsections: this._subsectionProcessor((section, tags) => {
        this._subsectTree.insertEdge(section, tags);
      }),
    };
  }

  _getRemoveIteratorFuncs() {
    return {
      subsections: this._subsectionProcessor((section) => {
        this._subsectTree.removeEdge(section);
      }),
    };
  }

  _subsectionProcessor(finalOp) {
    return (a, b) => {
      const aEdges = a.figure.edges(), bEdges = b.figure.edges();
      aEdges.forEach(e0 => {
        bEdges.forEach(e1 => {
          if (edges.coincident(e0, e1)) {
            edges.subsect(e0, e1)
              //.filter(section => {
              //  // filter out any subsections that are already known edges.
              //  const same = (test) => {
              //    return edges.same(section, test);
              //  };
              //  return !aEdges.some(same) && !bEdges.some(same);
              //})
              .forEach(section => {
                // now that we've found relevant subsectios, do a final
                // operation on them;
                finalOp(section, [a.id, b.id]);
              });
          }
        });
      });
    }
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

  _addToTree(figure) {
    figure.edges().forEach(edge => {
      this._vTree.insertEdge(edge, [ figure.id ]);
    });
  }

  _removeFromTree(figure) {
    figure.edges().forEach(edge => {
      edge.vertices().forEach(v => {
        const found = this._vTree.at(v);
        if (found) {
          this._vTree.removeEdge(edge);
          if (found.edges.length == 0) {
            this._vTree.remove(v);
          } else {
            found.removeTag(figure.id);
          }
        }
      });
    });
  }

}
