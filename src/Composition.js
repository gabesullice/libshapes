import * as vertex from "../src/Vertex";
import * as edges from "../src/Edge";
import * as figures from "../src/Figure";
import GapFinder from "./utils/GapFinder.js";
import {VertexTree} from "vertex-tree";

class Composition {

  constructor() {
    // _history is the only thing that must be initialized before any calls.
    this._history = []; 
    this.init(...arguments);
  }

  init({
    debug = false,
    bounds = [[0,0], [100,100]],
    doSnap = true,
    snapTolerance = 0.001,
    processGaps = false,
  } = {}) {
    this._record("init", [...arguments]);

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

    this._stopRecord();
  }

  figures() {
    return this._figures;
  }

  bounds(b0, b1) {
    this._record("bounds", [...arguments]);

    if (b0 !== undefined && b1 !== undefined) {
      this._bounds = new edges.Edge([b0, b1]);
    }
    const l = this._bounds.left(), r = this._bounds.right();
    const ret = [[l.x, l.y], [r.x, r.y]];

    this._stopRecord();

    return ret;
  }

  snap(doSnap) {
    this._record("snap", [...arguments]);

    if (doSnap !== undefined) {
      this._doSnap = doSnap;
    }

    this._stopRecord();

    return this._doSnap;
  }

  snapTolerance(tolerance) {
    this._record("snapTolerance", [...arguments]);

    if (tolerance !== undefined) {
      this._tolerance = tolerance;
    }

    this._stopRecord();

    return this._tolerance;
  }

  processGaps(doProcess) {
    this._record("processGaps", [...arguments]);

    if (doProcess !== undefined) {
      this._doProcessGaps = doProcess;
    }

    this._stopRecord();

    return this._doProcessGaps;
  }

  debug(debug) {
    if (debug !== undefined) {
      this._debug = debug;
      this._gapFinder.debug(debug);
    }
    return this._debug;
  }

  history() {
    return this._history;
  }

  log() {
    if (this.debug()) console.log(...arguments);
  }

  get(id) {
    return (this._figures.hasOwnProperty(id)) ? this._figures[id] : null;
  }

  overlapping() {
    const pairs = [];
    const ids = Object.keys(this._figures);
    while (ids.length > 0) {
      let id0 = ids.pop();
      ids.forEach(id1 => {
        if (figures.overlap(this.get(id0), this.get(id1))) {
          pairs.push({a: id0, b: id1});
        }
      });
    }
    return pairs;
  }

  gaps() {
    return this._gaps;
  }

  floats() {
    return Object.keys(this._figures).filter(id => {
      return !this._coincident().some(pair => pair.a == id || pair.b == id);
    });
  }

  nonIntegrated() {
    return Object.keys(this._figures).filter(id => {
      return !this._checkIntegrated(id, this.get(id));
    });
  }

  _coincident() {
    const coincidentPairs = [];
    const ids = Object.keys(this._figures);
    while (ids.length > 0) {
      let id0 = ids.pop();
      const fig0 = this.get(id0);
      ids.forEach(id1 => {
        const fig1 = this.get(id1);
        if (figures.coincident(fig0, fig1)) {
          coincidentPairs.push({a: id0, b: id1});
        }
      });
    }
    return coincidentPairs;
  }

  nonCoincident() {
    return Object.keys(this._figures)
      .map(key => { return {id: key, figure: this._figures[key]}; })
      .map(item => { item.edges = item.figure.edges(); return item })
      .filter(item => {
        return item.edges.some(e0 => {
          const areCoincident = e1 => edges.coincident(e0, e1);
          const left = this._subsectTree.at(e0.left());
          const right = this._subsectTree.at(e0.right());
          return (
            (left === undefined || !left.edges.some(areCoincident)) ||
            (right === undefined || !right.edges.some(areCoincident))
          );
        });
      })
      .map(item => item.id);
  }

  add(figure, options) {
    this._record("add", [...arguments]);

    const id = this._getID();
    this._doOperations(id, figure, this._getOperations("insert"));

    this._stopRecord();

    return id;
  }

  remove(id) {
    this._record("remove", [...arguments]);

    if (this._figures.hasOwnProperty(id)) {
      this._doOperations(id, this._figures[id], this._getOperations("remove"));
      return delete this._figures[id];
    }

    this._stopRecord();

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

  reflectOwnX(id, options) {
    return this.transform(id, {reflection: {x: true}}, options);
  }

  reflectOwnY(id, options) {
    return this.transform(id, {reflection: {y: true}}, options);
  }

  transform(id, transform, options) {
    this._record("transform", [...arguments]);

    let start, final;

    const {position, rotation, reflection} = transform;

    const transformOps = this._getOperations("transform").concat([
      {
        description: "Records the initial position of the figure",
        action: "transform",
        type: "singular",
        weight: -100,
        func: (id) => start = this._figures[id].position(),
      },
      {
        description: "Reflects the figure",
        action: "transform",
        type: "singular",
        weight: -0.1,
        func: (_, figure) => {
          if (reflection !== undefined) {
            const {x, y, _} = reflection;
            if (x) figure.reflectX();
            if (y) figure.reflectY();
            // In future, we may want reflection across arbitrary axes.
            //if (_) figure.reflect(_);
          }
        },
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

    this._stopRecord();

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
            if (this.debug()) throw e;
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
                if (this.debug()) throw e;
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
        description: "Processes any realignment that needs to happen",
        action: "insert",
        type: "singular",
        weight: -6,
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
        description: "Adds a figures edges to the vertex tree",
        action: "insert",
        type: "singular",
        weight: 0,
        func: ((id, figure) => {
          figure.edges().forEach(e => this._vTree.insertEdge(e, [id]));
        }),
      },
      {
        description: "Removes any gaps overlapped by the inserted figure",
        action: "insert",
        type: "singular",
        weight: 1,
        func: ((_, figure) => {
          this._gaps = this._gaps.filter(gap => !figures.overlap(figure, gap));
        }),
      },
      {
        description: "Find and process gaps on the figure's siblings",
        action: "insert",
        type: "singular",
        weight: 2,
        func: ((id, figure) => {
          // Gets the figures siblings and processes them for new gaps.
          this._getFigureSiblingIds(figure)
            .filter(fid => fid != id)
            .forEach(fid => {
              this._processGaps(fid, this.get(fid));
            });
        }),
      },
      {
        description: "Finds any gaps created by an inserted figure",
        action: "insert",
        type: "singular",
        weight: 2,
        func: ((id, figure) => {
          this._processGaps(id, figure);
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
        func: (id, figure) => this._removeFromVTree(id, figure),
      },
      {
        description: "Register siblings of the figure that was removed",
        action: "transform",
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
        description: "Removes any subsection records created by a moved figure",
        action: "transform",
        type: "iterator",
        weight: -1,
        func: ((a, b) => {
          this._removeFromSubsectTree(
            [a.id, b.id],
            figures.subsect(a.figure, b.figure),
          );
        }),
      },
      {
        description: "Removes any gap records for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: ((_, figure) => this._gaps = this._gaps.filter(gap => {
          return !figures.coincident(figure, gap);
        }))
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
        func: ((id, figure) => {
          figure.edges().forEach(e => this._vTree.insertEdge(e, [id]));
        }),
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
        func: ((_, figure) => this._gaps = this._gaps.filter(gap => {
          return !figures.coincident(figure, gap);
        }))
      },
      {
        description: "Removes any subsection records created by a removed figure",
        action: "remove",
        type: "iterator",
        weight: 0,
        func: ((a, b) => {
          this._removeFromSubsectTree(
            [a.id, b.id],
            figures.subsect(a.figure, b.figure), this._subsectTree,
          );
        }),
      },
      {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: ((id, figure) => this._removeFromVTree(id, figure)),
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
        if (gap0.edges().length > gaps[index].edges().length) {
          gaps.splice(index, 1, gap0);
        }
      } else {
        gaps.push(gap0);
      }
      return gaps;
    }, this._gaps || []);
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

  _removeIntersections(id) {
    this._intersecting = this._intersecting.filter(i => !(i.a == id || i.b == id));
  }

  _getFigureSiblingIds(figure) {
    // Get all the items around figure.
    const items = figure.vertices().reduce((items, v) => {
      const subsects = this._subsectTree.at(v);
      items = (subsects) ? items.concat(subsects) : items;
      const regulars = this._vTree.at(v);
      items = (regulars) ? items.concat(regulars) : items;
      return items;
    }, []);

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

  _removeFromVTree(id, figure) {
    this._removeFromTree([id], figure.edges(), this._vTree);
  }

  _removeFromSubsectTree(ids, sections) {
    this._removeFromTree(ids, sections, this._subsectTree);
  }

  _removeFromTree(ids, edges, tree) {
    edges.forEach(edge => {
      tree.removeEdge(edge);
    });
    edges.forEach(e => {
      e.vertices().forEach(v => {
        const result = tree.at(v);
        if (result) ids.forEach(id => result.removeTag(id));
      })
    });
  }

  _checkIntegrated(id, figure) {
    const vertices = figure.vertices();
    return vertices.every(v => {
      const item = this._vTree.at(v);
      if (item) {
        return item.tags.length > 1;
      }
      return false;
    });
  }

  _record(method, args) {
    if (this.debug()) {
      if (!this._recording) {
        switch (method) {
          case "add": {
            args.splice(0, 1, args[0].normalize());
            break;
          }
          default: {
          }
        }

        // If the last argument is null, it just shouldn't be recorded so that
        // defaults can be used.
        if (args[args.length - 1] === null) args.splice(-1, 1);

        this._history.push({method, args});
      }
      this._recording = true;
    }
  }

  _stopRecord() {
    this._recording = false;
  }

}

function same(a, b) {
  const as = Object.values(a.figures()), bs = Object.values(b.figures());

  while (as.length > 0) {
    const compare = as.pop();
    const index = bs.findIndex(elem => figures.same(compare, elem));
    if (index === -1) {
      return false;
    } else {
      bs.splice(index, 1);
    }
  }

  return bs.length == 0;
}

function fromHistory(history) {
  const composition = new Composition();
  replay(history, composition);
  return composition;
}

function replay(history, composition) {
  history.forEach(action => execute(action, composition));
}

function execute(action, composition) {
  const args = action.args;
  switch (action.method) {
    case "add": {
      args[0] = figures.denormalize(action.args[0]);
      break;
    }
    default: {}
  }
  //if (action.method == "transform") console.log(...args);
  composition[action.method].call(composition, ...args);
}

export default Composition;
export { Composition, same, fromHistory, replay };
