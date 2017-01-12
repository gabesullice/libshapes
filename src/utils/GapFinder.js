import * as edges from "../Edge";
import * as vertex from "../Vertex";
import * as figures from "../Figure";
import Shape from "../Shape";

export default class GapFinder {

  constructor ({vertexTree, subsectTree, debug = false} = {}) {
    this._vTree = vertexTree;
    this._subsectTree = subsectTree;
    this._debug = debug;
  }

  debug(isOn) {
    if (isOn !== undefined) {
      this._debug = isOn;
    }
    return this._debug;
  }

  log() {
    if (this.debug()) console.log(...arguments);
  }

  gapsFrom(figure, knownGaps) {
    const figureEdges = figure.edges();
    const lonely = figure.edges().filter((e0, _, original) => {
      const siblings = [].concat(...e0.vertices()
        .reduce((items, v) => {
          items.push(this._vTree.at(v));
          items.push(this._subsectTree.at(v));
          return items;
        }, [])
        .filter(item => item !== undefined)
        .map(item => item.edges));

      const counts = siblings.reduce((counts, edge) => {
        const index = counts.findIndex(count => edges.same(edge, count.edge));
        if (index !== -1) {
          counts[index].count++;
        } else {
          counts.push({edge: edge, count: 1});
        }
        return counts;
      }, []);

      const remaining = counts
        .filter(count => count.count > 2)
        .map(count => count.edge);

      return !remaining.some(e1 => edges.same(e0, e1));
    });

    if (lonely.length > 0 && lonely.length < figureEdges.length) {
      return lonely.reduce((gaps, edge, i) => {
        const found = this.findGap(edge, figure);

        // If we found a gap...
        if (found) {
          // and it doesn't overlap the original figure...
          const overlapsOriginal = figures.overlap(figure, found);
          // and it's not one that we've already found...
          const duplicate = gaps.concat(knownGaps).some(gap => {
            return figures.same(found, gap);
          });

          if (!duplicate) {
            gaps.push(found);
          }
        }

        return gaps;
      }, []);
    } else {
      return [];
    }
  }

  findGap(fromEdge, figure) {
    const v0 = fromEdge.left(), v1 = fromEdge.right();
    const gap0 = this.walkGap([v0, v1], 0);
    const gap1 = this.walkGap([v1, v0], 0);

    const sameAsFig = (gap) => {
      return gap.every(v0 => {
        const res = figure.vertices().some(v1 => {
          return vertex.same(v0, v1);
        });
        return res;
      });
    };

    if (gap0 && !sameAsFig(gap0)) {
      const points = gap0.map(v => {
        return [v.x, v.y];
      });
      return new figures.Figure({shape: new Shape(points)});
    } else if (gap1 && !sameAsFig(gap1)) {
      const points = gap1.map(v => {
        return [v.x, v.y];
      });
      return new figures.Figure({shape: new Shape(points)});
    } else {
      return false;
    }
  }

  walkGap(gap, count) {
    // Prevents getting into an infinite loop.
    if (count > 75) return false;

    const prev = gap[gap.length - 2];
    const curr = gap[gap.length - 1];
    const next = this.nextVertex(prev, curr);

    if (next === undefined) {
      return false;
    }

    if (vertex.same(next, prev)) {
      return false;
    }
    
    if (vertex.same(next, gap[0])) {
      const peek = this.nextVertex(curr, next);
      if (peek && vertex.same(peek, gap[1])) {
        return gap;
      }
    }

    gap.push(next);

    return this.walkGap(gap, count + 1);
  }

  nextVertex(last, current) {
    const edge = new edges.Edge([[last.x, last.y], [current.x, current.y]]);
    const around = this._getPossibleEdges(current);
    const possibles = around.filter(possible => {
      return !edges.same(edge, possible);
    });

    if (possibles.length == 0) {
      return undefined;
    }

    const nextEdge = this._nearestEdge(edge, current, possibles);

    // Derive the next vertex in the gap from the nearest edge.
    const next = nextEdge.vertices().filter(v => {
      return !vertex.same(current, v);
    })[0];

    return next;
  }

  _getPossibleEdges(v) {
    const regular = this._vTree.at(v) || {edges: [], tags: []};
    const subsected = this._subsectTree.at(v) || {edges: [], tags: []};
    // Get all the edges around a vertex into one array.
    let all = regular.edges.concat(subsected.edges);

    // Group all the edges by their angle.
    all = all.reduce((all, edge) => {
      if (all.length === 0) {
        all.push([edge]);
      } else {
        const index = all.findIndex((elem) => {
          return (
            Math.abs(edge.angle() - elem[0].angle()) < vertex.EPSILON
            && edges.coincident(edge, elem[0])
          );
        });
        if (index !== -1) {
          all[index].push(edge);
        } else {
          all.push([edge]);
        }
      }
      return all;
    }, []);

    // Sort groups by their length.
    all = all.map(group => {
      group.sort((a, b) => {
        return (a.length() < b.length()) ? -1 : 1;
      });
      return group;
    });

    // Look for any edges that may be hiding along the shortest edge.
    all = all.map(group => {
      const shortest = group[0];
      const closest = shortest.opposite(v);
      const query = {origin: shortest.midpoint(), radius: shortest.length()/2};
      const result = this._subsectTree.find(query);
      if (result && result.length > 0) {
        // 1. Extract the vertex from the result items.
        // 2. Filter out results which do not fall on the shortest edges line.
        // 3. Compute the distances from the original vertex and store it in a POJO.
        // 4. Find the nearest vertex.
        // 5. Extract that vertex from the POJO.
        const nearest = result
          .map(item => item.vertex)
          .filter(vFound => {
            if (Math.abs(shortest.slope()) === Infinity) {
              return Math.abs(vFound.x - v.x) < vertex.EPSILON;
            }
            const b = vFound.y - shortest.slope() * vFound.x;
            return Math.abs(b - shortest.yIntercept()) < vertex.EPSILON;
          })
          .map(vFound => {
            return {vertex: vFound, distance: vertex.distance(v, vFound)};
          })
          .reduce((nearest, current) => {
            return (nearest.distance < current.distance) ? nearest : current;
          }, {vertex: closest, distance: shortest.length()}).vertex;

        // Don't create an edge with two of the same vertices.
        if (!vertex.same(v, nearest)) {
          group.unshift(new edges.Edge([[v.x, v.y], [nearest.x, nearest.y]]));
        }

        return group;
      } else {
        return group;
      }
    });

    // Ungroup all the edges.
    all = [].concat(...all);

    // Remove all edges that are also a subsected edge
    // TRUE if the edge is not the same as any subsected edges (it's just a lonely regular edge)
    // OR 
    // TRUE if the edge IS a subsection, but only coincident with less than 2 regular edges
    all = all.filter(e0 => {
      // count regular coincidences
      const count = regular.edges.reduce((count, e1) => {
        return (edges.coincident(e0, e1)) ? count + 1 : count;
      }, 0);
      return (
        subsected.edges.some(e1 => !edges.same(e0, e1))
        || count < 2
      );
    });

    return all;
  }

  _nearestEdge(to, around, bundle) {
    const sorted = bundle.sort((a, b) => {
      const t0 = a.angle(around), t1 = b.angle(around);
      if (t0 < t1) {
        return -1;
      } else if (t0 > t1) {
        return 1;
      } else {
        return (a.length() < b.length()) ? -1 : 1;
      }
    });

    const angles = sorted.map(edge => edge.angle(around));


    const theta = to.angle(around);
    let indexNext = 0;
    for (let i = 0; i < angles.length; i++) {
      if (theta < angles[i]) {
        indexNext = i;
        break;
      }
    }
    // this.log('theta', theta);
    // this.log('angles', angles);
    // this.log('indexNext', indexNext);
    // this.log('prev', to);
    // this.log('next', sorted[indexNext]);
    return sorted[indexNext];
  }

  _getAngle(edge, v) {
    const same = (v0, v1) => vertex.same(v0, v1);
    const angle = (v0, v1) => Math.atan2(v0.x - v1.x, v0.y - v1.y);
    return (same(edge.left(), v)) ? angle(v, edge.right()) : angle(v, edge.left());
  }

}
