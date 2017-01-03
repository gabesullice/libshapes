import * as edges from "../../lib/Edge";
import * as vertex from "../../lib/Vertex";
import * as figures from "../../lib/Figure";
import Shape from "../../lib/Shape";

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

  log(label, variable, message) {
    if (this.debug()) {
      if (message) {
        console.log(label, variable, message);
      } else {
        console.log(label, variable);
      }
    }
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
    //const lonely = figureEdges.filter(edge => {
    //  const subsected = edge.vertices().reduce((subsected, v) => {
    //    const at = this._subsectTree.at(v) || {edges: []};
    //    return subsected.concat(at.edges);
    //  }, []);

    //  const coincident = (compare) => { return edges.coincident(edge, compare); };
    //  return !subsected.some(coincident);
    //});

    if (figureEdges.length > lonely.length && lonely.length > 0) {
      return lonely.reduce((gaps, edge, i) => {
        const found = this.findGap(edge, figure);

        // If we found a gap...
        if (found) {
          // and it's not one that we've already found...
          const duplicate = gaps.concat(knownGaps).some(gap => {
            return gap.vertices().every(v0 => {
              return found.vertices().some(v1 => {
                return vertex.same(v0, v1);
              });
            });
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

    if (vertex.same(next, prev)) {
      return false;
    }
    
    if (vertex.same(next, gap[0])) {
      return gap;
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

    this.log('possibles', possibles);

    const nextEdge = this._nearestEdge(edge, current, possibles);

    // Derive the next vertex in the gap from the nearest edge.
    const next = nextEdge.vertices().filter(v => {
      return !vertex.same(current, v);
    })[0];

    return next;
  }

  _getPossibleEdges(v) {
    const regular = this._vTree.at(v) || {edges: []};
    const subsected = this._subsectTree.at(v) || {edges: []};
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
            const b = vFound.y - shortest.slope() * vFound.x;
            return Math.abs(b - shortest.yIntercept()) < vertex.EPSILON;
          })
          .map(vFound => {
            return {vertex: vFound, distance: vertex.distance(v, vFound)};
          })
          .reduce((nearest, current) => {
            if (nearest === undefined) return current;
            return (nearest.distance < current.distance) ? nearest : current;
          }).vertex;

        group.unshift(new edges.Edge([[v.x, v.y], [nearest.x, nearest.y]]));

        return group;
      } else {
        return group;
      }
    });

    // Ungroup all the edges.
    all = [].concat(...all);

    // Count and record the occasions of duplicate edges. 
    const counted = all.reduce((counts, edge) => {
      const index = counts.findIndex(count => edges.same(edge, count.edge));
      if (index !== -1) {
        counts[index].count++;
      } else {
        counts.push({edge: edge, count: 1});
      }
      return counts;
    }, []);

    // Get only the edges with 2 or fewer occurences.
    const possibles = counted
      .filter(count => count.count < 3)
      .map(count => count.edge);

    //this.log('all', all);
    //this.log('counted', counted);
    this.log('possibles', possibles);

    return possibles;
  }

  _nearestEdge(to, around, bundle) {
    bundle.sort((a, b) => {
      const t0 = a.angle(around), t1 = b.angle(around);
      if (t0 < t1) {
        return -1;
      } else if (t0 == t1 && t0 == 0) {
        if (vertex.same(a.right(), b.left())) {
          return 1;
        } else if (vertex.same(b.right(), a.left())) {
          return -1;
        } else {
          return (a.length() < b.length()) ? -1 : 1;
        }
      } else if (t0 == t1 && t0 == Math.PI/2) {
        if (vertex.same(a.top(), b.bottom())) {
          return 1;
        } else if (vertex.same(b.top(), a.bottom())) {
          return -1;
        } else {
          return (a.length() < b.length()) ? -1 : 1;
        }
      } else {
        return 1;
      }
    });

    let nextIndex = 0;
    const theta = to.angle(around);
    this.log('bundle', bundle);
    this.log('theta', theta);
    for (let i = 0; i < bundle.length; i++) {
      let compare = bundle[i].angle(around);
      this.log('compare', compare);
      if (theta < compare) {
        nextIndex = i;
        break;
      }
    }
    return bundle[nextIndex];
  }

  _getAngle(edge, v) {
    const same = (v0, v1) => vertex.same(v0, v1);
    const angle = (v0, v1) => Math.atan2(v0.x - v1.x, v0.y - v1.y);
    return (same(edge.left(), v)) ? angle(v, edge.right()) : angle(v, edge.left());
  }

}
