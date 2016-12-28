import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";
import GapFinder from "./GapFinder.js";
import {VertexTree} from "vertex-tree";

export default class Composition {

  constructor(options) {
    let bounds = [[0,0], [100,100]];
    let doSnap = true;
    let snapTolerance = 0.001;
    let processGaps = false;
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
    this._vTree = new VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length(),
    });
    this._subsectTree = new VertexTree({
      leftBound: 0,
      rightBound: this._bounds.length(),
    });
    this._gapFinder = new GapFinder({
      vertexTree: this._vTree,
      subsectTree: this._subsectTree,
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

  get(id) {
    return (this._figures.hasOwnProperty(id)) ? this._figures[id] : null;
  }

  overlapping() {
    return this._overlapping;
  }

  gaps() {
    return this._gaps;
  }

  add(figure, options) {
    const id = this._getID();
    this._doOperations(id, figure, this._getOperations("insert"));
    return id;
  }

  remove(id) {
    if (this._figures.hasOwnProperty(id)) {
      this._doOperations(id, this._figures[id], this._getOperations("remove"));
      return delete this._figures[id];
    }
    return false;
  }

  move(id, position, options) {
    this._removeFromTree(this._figures[id]);
    const start = this._figures[id].position();
    const target = this._figures[id].position(position);
    const final = this._handleSnap(id, options);
    this._removeOverlaps(id);
    this._removeIntersections(id);
    this._addToTree(this._figures[id]);
    this._iterateFigures(id, this._getIteratorFuncs("insert"));
    //this._removeGaps(id);
    this._processGaps(id, this._figures[id]);
    return {
      start, target, final,
      snapped: (this._doSnap && (target[0] != final[0] || target[1] != final[1])),
    };
  }

  _doOperations(id, figure, operations) {
    this._organizeOperations(operations).forEach(set => {
      if (set.hasOwnProperty("singular")) {
        set.singular.forEach(operation => {
          try {
            operation.func(id, figure);
          } catch (e) {
            console.log(`"${operation.description}" failed with exception:`, e);
          }
        });
      }

      if (set.hasOwnProperty("iterator")) {
        Object.keys(this._figures).forEach(fid => {
          const curr = this._figures[fid];
          if (id != fid) {
            set.iterator.forEach(operation => {
              try {
                operation.func(
                  {id: id, figure: figure},
                  {id: fid, figure: curr},
                );
              } catch (e) {
                console.log(`"${operation.description}" failed with exception:`, e);
              }
            });
          }
        });
      }
    });
  }

  _organizeOperations(operations) {
    // 1. Only return operations for the given action
    // 2. Sort the operations by weight
    // 3. Bundle the operations by weight into sets of operation
    // 4. Bundle operations within each set by their type
    return operations
      .sort((a, b) => {
        return (a.weight < b.weight) ? -1 : 1;
      })
      .reduce((ops, operation) => {
        if (ops.lastWeight === undefined) {
          ops.sets[0].push(operation);
        } else if (ops.lastWeight < operation.weight) {
          ops.sets.push([operation]);
        } else {
          ops.sets[ops.sets.length - 1].push(operation);
        }
        ops.lastWeight = operation.weight;
        return ops;
      }, {lastWeight: undefined, sets: [[]]})
      .sets
      .map(set => {
        return set.reduce((ops, operation) => {
          if (ops[operation.type] === undefined) {
            ops[operation.type] = [operation];
          } else {
            ops[operation.type].push(operation);
          }
          return ops;
        }, {});
      });
  }

  _getOperations(action) {
    return [
      {
        description: "Adds a figure to the figures list",
        action: "insert",
        type: "singular",
        weight: -100,
        func: ((id, figure) => this._figures[id] = figure),
      },
      {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: -1,
        func: ((_, figure) => this._addToTree(figure)),
      },
      {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 0,
        func: ((id, figure) => this._processGaps(id, figure)),
      },
      {
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -2,
        func: (id => this._handleSnap(id)),
      },
      {
        description: "Finds and stores instersecting figures",
        action: "insert",
        type: "iterator",
        weight: -5,
        func: ((a, b) => {
          if (figures.intersect(a.figure, b.figure)) {
            this._intersecting.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Finds and stores overlapping figures",
        action: "insert",
        type: "iterator",
        weight: -4,
        func: ((a, b) => {
          if (figures.overlap(a.figure, b.figure)) {
            this._overlapping.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "insert",
        type: "iterator",
        weight: -3,
        func: ((a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }),
      },
      {
        description: "Removes any overlap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: (id => this._removeOverlaps(id)),
      },
      {
        description: "Removes any intersection records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: (id => this._removeIntersections(id)),
      },
      {
        description: "Removes any gap records for a removed figure",
        action: "remove",
        type: "singular",
        weight: 0,
        func: (id => this._removeGaps(id)),
      },
      {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: ((a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.removeEdge(section);
          });
        }),
      },
      {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: ((_, figure) => this._removeFromTree(figure)),
      },
    ].filter(elem => elem.action === action);
  }

  _processGaps(id, figure) {
    if (!this._doProcessGaps) return;

    // If this figure intersects with another figure, do not find its gaps.
    //if (this.doLog) console.log(id, this._intersecting);
    if (this._intersecting.some(i => (i.a == id || i.b == id))) {
      return;
    }

    this._gaps = this._gaps.concat(this._gapFinder.gapsFrom(figure, this._gaps));
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

  _removeGaps(removedId) {
    if (!this._doProcessGaps) return;

    const removed = this._figures[removedId];

    this._gaps.forEach((gap, index) => {
      if (gap.edges().some((gapEdge, index) => {
        return removed.edges().some(removeEdge => {
          return edges.coincident(gapEdge, removeEdge);
        });
      })) {
        delete this._gaps[index];
        this._processGaps("gap", gap);
      };
    });
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

  _iterateFigures(id, iteratorFuncs) {
    const figs = this._figures;
    for (var k in figs) {
      if (id != k) {
        const figA = figs[k], figB = figs[id];
        for (var funcName in iteratorFuncs) {
          iteratorFuncs[funcName](
            {id: k, figure: figA},
            {id: id, figure: figB}
          );
        }
      }
    }
  }

  _getIteratorFuncs(operation) {
    const funcs = {
      insert: {
        intersect: (a, b) => {
          if (figures.intersect(a.figure, b.figure)) {
            this._intersecting.push({a: a.id, b: b.id});
          }
        },
        overlap: (a, b) => {
          if (figures.overlap(a.figure, b.figure)) {
            this._overlapping.push({a: a.id, b: b.id});
          }
        },
        subsections: (a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        },
      },
      remove: {
      },
      move: {
      },
    };

    return funcs[operation];
  }

  _removeOverlaps(id) {
    this._overlapping = this._overlapping.filter(overlap => {
      return !(overlap.a == id || overlap.b == id);
    });
  }

  _removeIntersections(id) {
    this._intersecting = this._intersecting.filter(intersect => {
      return !(intersect.a == id || intersect.b == id);
    });
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
