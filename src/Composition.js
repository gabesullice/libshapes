import * as vertex from "../lib/Vertex";
import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";
import GapFinder from "./utils/GapFinder.js";
import {VertexTree} from "vertex-tree";

export default class Composition {

  constructor({
    debug = false,
    bounds = [[0,0], [100,100]],
    doSnap = true,
    snapTolerance = 0.001,
    processGaps = false,
  } = {}) {
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

  processGaps(doProcess) {
    if (doProcess !== undefined) {
      this._doProcessGaps = doProcess;
    }
    return this._doProcessGaps;
  }

  debug(debug) {
    if (debug !== undefined) {
      this._debug = debug;
      this._gapFinder.debug(debug);
    }
    return this._debug;
  }

  log() {
    if (this.debug()) console.log(...arguments);
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
        weight: -100,
        func: (id) => start = this._figures[id].position(),
      },
      {
        description: "Moves a figure to a specified position",
        action: "transform",
        type: "singular",
        weight: 0,
        func: (_, figure) => {
          if (position !== undefined) figure.position(position);
        },
      },
      {
        description: "Rotates the figure to a specified position",
        action: "transform",
        type: "singular",
        weight: 0,
        func: (_, figure) => {
          if (rotation !== undefined) figure.rotation(rotation);
        },
      },
      {
        description: "Handles snap for a moved figure",
        action: "transform",
        type: "singular",
        weight: 0,
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
    const organized = this._organizeOperations(operations);
    while (organized.length > 0) {
      const batch = organized.shift();
      if (batch.hasOwnProperty("singular")) {
        batch.singular.forEach(operation => {
          try {
            operation.func(id, figure);
          } catch (e) {
            this.log(
              `"${operation.description}" failed with exception:`,
              e.message
            );
            throw e;
          }
        });
      }

      if (batch.hasOwnProperty("iterator")) {
        Object.keys(this._figures).forEach(fid => {
          const curr = this._figures[fid];
          if (id != fid) {
            batch.iterator.forEach(operation => {
              try {
                operation.func(
                  {id: id, figure: figure},
                  {id: fid, figure: curr},
                );
              } catch (e) {
                this.log(
                  `"${operation.description}" failed with exception:`,
                  e.message
                );
                throw e;
              }
            });
          }
        });
      }
    }
  }

  _organizeOperations(operations) {
    // 1. Bundle the operations by weight into batches
    // 2. Sort the batches by weight
    // 3. Bundle operations within each set by their type
    const organized = operations.reduce((ops, operation) => {
        const index = ops.findIndex(set => set[0].weight == operation.weight);
        if (index !== -1) {
          ops[index].push(operation);
        } else {
          ops.push([operation]);
        }
        return ops;
      }, [])
      .sort((a, b) => {
        return (a[0].weight < b[0].weight) ? -1 : 1;
      })
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
    return organized;
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
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -2,
        func: (id => this._handleSnap(id)),
      },
      {
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: -1,
        func: ((_, figure) => this._addToTree(figure)),
      },
      {
        description: "Removes any gaps overlapped by the inserted figure",
        action: "insert",
        type: "singular",
        weight: 0,
        func: ((_, figure) => {
          this._gaps = this._gaps.filter(gap => !figures.overlap(figure, gap));
        }),
      },
      {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 1,
        func: ((id, figure) => {
          this._processGaps(id, figure);
        }),
      },
      {
        description: "Find and process gaps on the figure's siblings",
        action: "insert",
        type: "singular",
        weight: 0,
        func: ((id, figure) => {
          // Gets the figures siblings and processes them for new gaps.
          this._getFigureSiblingIds(figure)
            .filter(fid => fid != id)
            .forEach(fid => {
              this._processGaps(fid, this.get(fid));
            });
        }),
      },
    ].concat(
      this._removeOperations(),
      this._transformOperations()
    ).filter(elem => elem.action === action);
  }

  _transformOperations() {
    let siblings = [];
    return [
      {
        description: "Removes the unmoved figures edges from the vertex tree",
        action: "transform",
        type: "singular",
        weight: -3,
        func: (id) => this._removeFromTree(this._figures[id]),
      },
      {
        description: "Register siblings of the figure that was removed",
        action: "remove",
        type: "singular",
        weight: -2,
        func: ((id, figure) => {
          // Gets the figures siblings and processes them for new gaps.
          siblings = this._getFigureSiblingIds(figure).filter(fid => {
            return fid != id;
          });
        }),
      },
      {
        description: "Removes any subsection records created by a removed figure",
        action: "transform",
        type: "iterator",
        weight: -1,
        func: ((a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.removeEdge(section);
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
        weight: 2,
        func: ((_, figure) => this._addToTree(figure)),
      },
      {
        description: "Finds and stores subsected edges created by coincident figures",
        action: "transform",
        type: "iterator",
        weight: 2,
        func: ((a, b) => {
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.insertEdge(section, [a.id, b.id]);
          });
        }),
      },
      {
        description: "Finds and stores instersecting figures",
        action: "transform",
        type: "iterator",
        weight: 3,
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
        weight: 3,
        func: ((a, b) => {
          if (figures.overlap(a.figure, b.figure)) {
            this._overlapping.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Removes any gaps overlapped by the moved figure",
        action: "transform",
        type: "singular",
        weight: 3,
        func: ((_, figure) => {
          this._gaps = this._gaps.filter(gap => !figures.overlap(figure, gap));
        }),
      },
      {
        description: "Process gaps on the moved figures siblings",
        action: "transform",
        type: "singular",
        weight: 4,
        func: () => {
          siblings.forEach(siblingId => {
            this._processGaps(siblingId, this._figures[siblingId]);
          });
        },
      },
      {
        description: "Finds any gaps created by the moved figure",
        action: "transform",
        type: "singular",
        weight: 4,
        func: ((id, figure) => this._processGaps(id, figure)),
      },
    ];
  }

  _removeOperations() {
    let siblings = [];
    return [
      {
        description: "Register siblings of the figure that was removed",
        action: "remove",
        type: "singular",
        weight: -1,
        func: ((id, figure) => {
          // Gets the figures siblings and processes them for new gaps.
          siblings = this._getFigureSiblingIds(figure).filter(fid => {
            return fid != id;
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
        description: "Process gaps on the removed figures siblings",
        action: "remove",
        type: "singular",
        weight: 2,
        func: () => {
          siblings.forEach(siblingId => {
            this._processGaps(siblingId, this._figures[siblingId]);
          });
        },
      },
    ];
  }

  _processGaps(id, figure) {
    if (!this.processGaps()) return;

    // If this figure intersects with another figure, do not find its gaps.
    if (this._intersecting.some(i => (i.a == id || i.b == id))) {
      return;
    }

    const found = this._gapFinder.gapsFrom(figure, this._gaps);
    this._gaps = found.reduce((gaps, gap0) => {
      const index = gaps.findIndex(gap1 => {
        return figures.overlap(gap0, gap1)
      });
      if (index !== -1) {
        gaps.splice(index, 1, gap0);
      } else {
        gaps.push(gap0);
      }
      return gaps;
    }, this._gaps || []);
  }

  _removeGaps(removedId) {
    if (!this.processGaps()) return;

    const removed = this._figures[removedId];

    this._gaps.forEach((gap, index) => {
      if (gap.edges().some((gapEdge, index) => {
        return removed.edges().some(removeEdge => {
          return edges.coincident(gapEdge, removeEdge);
        });
      })) {
        this._gaps.splice(index, 1);
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
    // Get all the items around figure.
    const items = figure.vertices().reduce((items, v) => {
      const result = this._subsectTree.at(v);
      return (result) ? items.concat(result) : items;
    }, []);


    // Eliminate items which do not have a coincident edge with the figure.
    const relevant = items.filter(item => {
      // @todo: remove this code block unless something is broken by doing it
      //return true;
      return figure.edges().some(e0 => {
        return item.edges.some(e1 => edges.coincident(e0, e1));
      });
    });

    // 1. Extract the tags (which are figure ids) from each item.
    // 2. Deduplicate the fids.
    const fids = items
      .map(item => item.tags)
      .reduce((fids, tags) => {
        return tags.reduce((fids, tag) => {
          if (!fids.some(fid => fid == tag)) fids.push(tag);
          return fids;
        }, fids);
      }, []);

    // Filter out figure ids which aren't siblings of the given figure.
    return fids.filter(fid => {
      return figures.siblings(figure, this._figures[fid]);
    });
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
