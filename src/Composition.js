import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";
import GapFinder from "./utils/GapFinder.js";
import {VertexTree} from "vertex-tree";

export default class Composition {

  constructor(options) {
    let debug = false;
    let bounds = [[0,0], [100,100]];
    let doSnap = true;
    let snapTolerance = 0.001;
    let processGaps = false;
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
      debug,
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

  // Deprecated. Please use `Composition.moveTo()`.
  move(id, target, options) {
    return this.moveTo(...arguments);
  }

  moveTo(id, target, options) {
    return this.transform(id, {position: target}, options);
  }

  rotateTo(id, target, options) {
    return this.transform(id, {rotation: target}, options);
  }

  transform(id, transform, options) {
    let start, final;

    const {position, rotation} = transform;

    const transformOps = this._getOperations("transform").concat([
      {
        description: "Records the initial position of the figure",
        action: "transform",
        type: "singular",
        weight: -3,
        func: (id) => start = this._figures[id].position(),
      },
      {
        description: "Moves a figure to a specified position",
        action: "transform",
        type: "singular",
        weight: -1,
        func: (_, figure) => {
          if (position !== undefined) figure.position(position);
        },
      },
      {
        description: "Rotates the figure to a specified position",
        action: "transform",
        type: "singular",
        weight: -1,
        func: (_, figure) => {
          if (rotation !== undefined) figure.rotation(rotation);
        },
      },
      {
        description: "Handles snap for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: (id => {
          final = this._handleSnap(id, options);
        }),
      },
    ]);

    this._doOperations(id, this._figures[id], transformOps);

    const didSnap = (
      this._doSnap
      && position !== undefined
      && (position[0] != final[0] || position[1] != final[1])
    );

    return {
      start,
      target: position,
      final,
      snapped: didSnap,
    };
  }

  _doOperations(id, figure, operations) {
    this._organizeOperations(operations).forEach(set => {
      if (set.hasOwnProperty("singular")) {
        set.singular.forEach(operation => {
          try {
            operation.func(id, figure);
          } catch (e) {
            console.log(
              `"${operation.description}" failed with exception:`,
              e.message
            );
            throw e;
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
                console.log(
                  `"${operation.description}" failed with exception:`,
                  e.message
                );
                throw e;
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
      {
        description: "Processes gaps for a removed figure",
        action: "remove",
        type: "singular",
        weight: -1,
        func: ((_, figure) => {
          // Gets the figures siblings and processes them for new gaps.
          const fids = this._getFigureSiblingIds(figure);
          fids.forEach(id => {
            this._processGaps(id, this._figures[id]);
          });
        }),
      },
      {
        description: "Removes any overlap records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: (id => this._removeOverlaps(id)),
      },
      {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: (id => this._removeIntersections(id)),
      },
      {
        description: "Removes any intersection records for a removed figure",
        action: "transform",
        type: "singular",
        weight: 1,
        func: (id => this._removeIntersections(id)),
      },
      {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 1,
        func: ((_, figure) => this._addToTree(figure)),
      },
      {
        description: "Adds a moved figure's edges back into the vertex tree",
        action: "transform",
        type: "singular",
        weight: 0,
        func: ((_, figure) => this._addToTree(figure)),
      },
      {
        description: "Finds and stores instersecting figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: ((a, b) => {
          if (figures.intersect(a.figure, b.figure)) {
            this._intersecting.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Finds and stores overlapping figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: ((a, b) => {
          if (figures.overlap(a.figure, b.figure)) {
            this._overlapping.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "transform",
        type: "iterator",
        weight: 1,
        func: ((a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }),
      },
      {
        description: "Removes the unmoved figures edges from the vertex tree",
        action: "transform",
        type: "singular",
        weight: -2,
        func: (id) => this._removeFromTree(this._figures[id]),
      },
    ].filter(elem => elem.action === action);
  }

  _processGaps(id, figure) {
    if (!this._doProcessGaps) return;

    // If this figure intersects with another figure, do not find its gaps.
    if (this._intersecting.some(i => (i.a == id || i.b == id))) {
      return;
    }

    this._gaps = this._gaps.concat(this._gapFinder.gapsFrom(figure, this._gaps));
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
    let solution;

    fig.vertices().forEach(v0 => {
      const query = {
        origin: v0,
        radius: this._tolerance * this._bounds.length(),
      };

      const result = this._vTree.find(query).map(item => item.vertex);
      if (!result) return;

      solution = result
        .map(v1 => {
          return {
            distance: vertex.distance(v0, v1),
            translation: [v1.x - v0.x, v1.y - v0.y],
          }
        })
        .reduce((solution, current) => {
          return (
            solution !== undefined
            && solution.distance < current.distance
          ) ? solution : current;
        }, solution);
    });

    if (solution && solution.distance > vertex.EPSILON) {
      return solution.translation;
    } else {
      return [0, 0];
    }
  }

  _removeOverlaps(id) {
    this._overlapping = this._overlapping.filter(o => !(o.a == id || o.b == id));
  }

  _removeIntersections(id) {
    this._intersecting = this._intersecting.filter(i => !(i.a == id || i.b == id));
  }

  _getFigureSiblingIds(figure) {
    return figure.edges().reduce((all, e0) => {

      const vertices = e0.vertices();

      const items = vertices.reduce((items, v) => {
        const result = this._subsectTree.at(v);
        return (result) ? items.concat(result) : items;
      }, []);

      const relevant = items.filter(item => {
        return item.edges.some(e1 => edges.coincident(e0, e1));
      });

      //const fids = relevant
      const fids = items
        .map(item => item.tags)
        .reduce((fids, tags) => {
          tags.forEach(tag => {
            if (fids.indexOf(tag) === -1) fids.push(tag);
          });
          return fids;
        }, []);

      const siblings = fids.filter(fid => {
        return figures.siblings(figure, this._figures[fid]);
      });

      all = all.concat(siblings.filter(fid => !all.some(id => id == fid)));
      return all;
    }, []);
  }

  _getID() {
    const id = "fig-" + this._count;
    this._count++;
    return id;
  }

  _addToTree(figure) {
    figure.edges().forEach(e => this._vTree.insertEdge(e, [ figure.id ]));
  }

  _removeFromTree(figure) {
    figure.edges().forEach(edge => {
      this._vTree.removeEdge(edge);
      edge.vertices().forEach(v => {
        const result = this._vTree.at(v);
        if (result) result.removeTag(figure.id);
      });
    });
  }

}
