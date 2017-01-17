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

  snap(doSnap) {
    if (doSnap !== undefined) {
      this._doSnap = doSnap;
    }
    return this._doSnap;
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

  floats() {
    return this._floats;
  }

  nonIntegrated() {
    return this._nonIntegrated;
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
        description: "Keeps a record of coincident pairs",
        action: "insert",
        type: "iterator",
        weight: -1,
        func: ((a, b) => {
          if (figures.coincident(a.figure, b.figure)) {
            this._coincidentPairs.push({a: a.id, b: b.id});
          }
        }),
      },
      {
        description: "Check and records floats for inserted figures",
        action: "insert",
        type: "singular",
        weight: -0.9,
        func: ((id, figure) => {
          // if the inserted is not paired with anything, it's a float
          // if it is paired with something, it's not a float
          // remove any of it's new pairs from floats
          const isInPairs = (id, pairs) => {
            return pairs.some(pair => (pair.a == id || pair.b == id));
          };

          if (!isInPairs(id, this._coincidentPairs)) {
            this._floats.push(id);
          } else {
            this._floats = this._floats.filter(fid => {
              return !isInPairs(fid, this._coincidentPairs);
            });
          }
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
        description: "Records if a figure is not fully integrated (all of its vertices are shared)",
        action: "insert",
        type: "singular",
        weight: 1,
        func: ((id, figure) => {
          if (!this._checkIntegrated(id, figure)) {
            this._nonIntegrated.push(id);
          }

          figure
            .vertices()
            .map(v => this._vTree.at(v))
            .filter(item => item !== undefined)
            .filter(item => item.tags.length > 1)
            .reduce((tags, item) => tags.concat(item.tags), [])
            .filter(tag => tag != id)
            .reduce((dedupe, tag) => {
              return (dedupe.findIndex(id => tag == id) === -1) ? dedupe.concat(tag) : dedupe;
            }, [])
            .forEach(tag => {
              const twin = {a: id, b: tag};
              if (this._vertexTwins.findIndex(compare => {
                return (
                  (compare.a == twin.a && compare.b == twin.b) ||
                  (compare.a == twin.b && compare.b == twin.a)
                );
              }) === -1) {
                this._vertexTwins.push(twin);
              }
              if (this._checkIntegrated(tag, this.get(tag))) {
                this._nonIntegrated = this._nonIntegrated.filter(id => id != tag);
              } else {
                if (this._nonIntegrated.findIndex(id => tag == id) === -1) {
                  this._nonIntegrated.push(tag);
                }
              }
            });
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
        func: (id, figure) => this._removeFromTree(id, figure),
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
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.removeEdge(section);
          });
        }),
      },
      {
        description: "Removes any overlap records for a moved figure",
        action: "transform",
        type: "singular",
        weight: -1,
        func: (id => this._removeOverlaps(id)),
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
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "transform",
        type: "singular",
        weight: 1.0,
        func: id => {
          const data = this._coincidentPairs.reduce((data, pair) => {
            if (pair.a == id || pair.b == id) {
              const counterpart = (pair.a == id) ? pair.b : pair.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(pair);
              data.unpaired = data.unpaired.filter(fid => {
                return !(pair.a == fid || pair.b == fid);
              });
            }
            return data;
          }, {unpaired: [], remaining: []});

          this._coincidentPairs = data.remaining;
          this._floats = this._floats.concat(data.unpaired);
        },
      },
      {
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "transform",
        type: "iterator",
        weight: 1.1,
        func: (a, b) => {
          if (figures.coincident(a.figure, b.figure)) {
            this._coincidentPairs.push({a: a.id, b: b.id});
          }
        },
      },
      {
        description: "Keeps record of any floating figures",
        action: "transform",
        type: "singular",
        weight: 1.2,
        func: ((id, figure) => {
          // if the inserted is not paired with anything, it's a float
          // if it is paired with something, it's not a float
          // remove any of it's new pairs from floats
          const isInPairs = (id, pairs) => {
            return pairs.some(pair => (pair.a == id || pair.b == id));
          };

          if (!isInPairs(id, this._coincidentPairs)) {
            this._floats.push(id);
          } else {
            this._floats = this._floats.filter(fid => {
              return !isInPairs(fid, this._coincidentPairs);
            });
          }
        }),
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
        description: "Removes old vertex twin records and makes new ones if needed",
        action: "transform",
        type: "singular",
        weight: 2.9,
        func: (id, figure) => {
          const data = this._vertexTwins.reduce((data, twin) => {
            if (twin.a == id || twin.b == id) {
              const counterpart = (twin.a == id) ? twin.b : twin.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(twin);
            }
            return data;
          }, {unpaired: [], remaining: []});

          data.unpaired
            .filter(tag => !this._checkIntegrated(tag, this.get(tag)))
            .forEach(tag => {
              if (!this._nonIntegrated.some(fid => fid == tag)) {
                this._nonIntegrated.push(tag);
              } else {
                this._nonIntegrated.filter(fid => fid != tag)
              }
            });

          this._vertexTwins = data.remaining;
        },
      },
      {
        description: "Records if a figure is not fully integrated (all of its vertices are shared)",
        action: "transform",
        type: "singular",
        weight: 3,
        func: ((id, figure) => {
          if (!this._checkIntegrated(id, figure)) {
            this._nonIntegrated.push(id);
          } else {
            this._nonIntegrated = this._nonIntegrated.filter(fid => fid != id)
          }

          figure
            .vertices()
            .map(v => this._vTree.at(v))
            .filter(item => item !== undefined)
            .filter(item => item.tags.length > 1)
            .reduce((tags, item) => tags.concat(item.tags), [])
            .filter(tag => tag != id)
            .reduce((dedupe, tag) => {
              return (dedupe.findIndex(id => tag == id) === -1) ? dedupe.concat(tag) : dedupe;
            }, [])
            .forEach(tag => {
              const twin = {a: id, b: tag};
              if (this._vertexTwins.findIndex(compare => {
                return (
                  (compare.a == twin.a && compare.b == twin.b) ||
                  (compare.a == twin.b && compare.b == twin.a)
                );
              }) === -1) {
                this._vertexTwins.push(twin);
              }
              if (this._checkIntegrated(tag, this.get(tag))) {
                this._nonIntegrated = this._nonIntegrated.filter(id => id != tag);
              } else {
                if (this._nonIntegrated.findIndex(id => tag == id) === -1) {
                  this._nonIntegrated.push(tag);
                }
              }
            });
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
          figures.subsect(a.figure, b.figure).forEach(section => {
            this._subsectTree.removeEdge(section);
          });
        }),
      },
      {
        description: "Removes old coincident pair records and takes new ones if needed",
        action: "remove",
        type: "singular",
        weight: 1,
        func: (id, figure) => {
          const data = this._coincidentPairs.reduce((data, pair) => {
            if (pair.a == id || pair.b == id) {
              const counterpart = (pair.a == id) ? pair.b : pair.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(pair);
              data.unpaired = data.unpaired.filter(fid => {
                return !(pair.a == fid || pair.b == fid);
              });
            }
            return data;
          }, {unpaired: [], remaining: []});

          this._coincidentPairs = data.remaining;
          this._floats = this._floats.concat(data.unpaired);
        },
      },
      {
        description: "Removes the removed figure id from the float record",
        action: "remove",
        type: "singular",
        weight: 1,
        func: id => {
          this._floats = this._floats.filter(fid => (fid != id));
        },
      },
      {
        description: "Removes a figures edges from the vertex tree",
        action: "remove",
        type: "singular",
        weight: 1,
        func: ((id, figure) => this._removeFromTree(id, figure)),
      },
      {
        description: "Removes old vertex twin records and makes new ones if needed",
        action: "remove",
        type: "singular",
        weight: 2,
        func: (id, figure) => {
          const data = this._vertexTwins.reduce((data, twin) => {
            if (twin.a == id || twin.b == id) {
              const counterpart = (twin.a == id) ? twin.b : twin.a;
              data.unpaired.push(counterpart);
            } else {
              data.remaining.push(twin);
            }
            return data;
          }, {unpaired: [], remaining: []});

          data.unpaired
            .filter(tag => !this._checkIntegrated(tag, this.get(tag)))
            .forEach(tag => {
              if (!this._nonIntegrated.some(fid => fid == tag)) {
                this._nonIntegrated.push(tag);
              } else {
                this._nonIntegrated.filter(fid => fid != tag)
              }
            });

          this._nonIntegrated = this._nonIntegrated.filter(fid => fid != id);
          this._vertexTwins = data.remaining;
        },
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
        if (gap0.edges().length > gap1.edges().length) {
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

  _removeOverlaps(id) {
    this._overlapping = this._overlapping.filter(o => !(o.a == id || o.b == id));
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

  _removeFromTree(id, figure) {
    figure.edges().forEach(edge => {
      this._vTree.removeEdge(edge);
    });
    figure.vertices().forEach(v => {
      const result = this._vTree.at(v);
      if (result) result.removeTag(id);
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

}
