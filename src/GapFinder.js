import * as edges from "../lib/Edge";
import * as vertex from "../lib/Vertex";
import * as figures from "../lib/Figure";
import Shape from "../lib/Shape";

export default class GapFinder {

  constructor ({vertexTree, subsectTree} = {}) {
    this._vTree = vertexTree;
    this._subsectTree = subsectTree;
  }

  gapsFrom(figure, knownGaps) {
    const figureEdges = figure.edges();

    const lonely = figureEdges.filter(edge => {
      const subsected = edge.vertices().reduce((subsected, v) => {
        const at = this._subsectTree.at(v) || {edges: []};
        return subsected.concat(at.edges);
      }, []);

      const coincident = (compare) => { return edges.coincident(edge, compare); };
      return !subsected.some(coincident);
    });

    //if (this.doLog) console.log('figureEdges', figureEdges);
    //if (this.doLog) console.log('lonely', lonely);

    if (figureEdges.length > lonely.length && lonely.length > 0) {
      return lonely.reduce((gaps, edge, i) => {
        const found = this.findGap(edge, figure);

        // If we found a gap...
        if (found) {
          //if (this.doLog) console.log(found);
          //if (this.doLog) console.log(this._gaps);
          // and it's not one that we've already found...
          const duplicate = gaps.concat(knownGaps).some(gap => {
            return gap.vertices().every(v0 => {
              return found.vertices().some(v1 => {
                return vertex.same(v0, v1);
              });
            });
          });

          if (!duplicate) {
            //if (this.doLog) console.log(found);
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
    //if (this.doLog) console.log('fromEdge', fromEdge);
    const gap0 = this._walkGap([v0, v1], 0);
    const gap1 = this._walkGap([v1, v0], 0);

    const sameAsFig = (gap) => {
      return gap.every(v0 => {
        const res = figure.vertices().some(v1 => {
          return vertex.same(v0, v1);
        });
        return res;
      });
    };

    //if (this.doLog) console.log('gap0', gap0);
    //if (this.doLog) console.log('gap1', gap1);

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

  _walkGap(gap, count) {
    // Prevents getting into an infinite loop.
    if (count > 75) return false;

    //if (this.doLog) console.log('gap', gap);

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

    return this._walkGap(gap, count + 1);
  }

  nextVertex(last, current) {
    const edge = new edges.Edge([[last.x, last.y], [current.x, current.y]]);
    const around = this._getPossibleEdges(current);
    const possibles = around.filter(possible => {
      return !edges.same(edge, possible);
    });
    //if (this.doLog) console.log('current', current);
    //if (this.doLog) console.log('around', around);
    //if (this.doLog) console.log('possibles', possibles);

    const nextEdge = this._nearestEdge(edge, possibles);

    // Derive the next vertex in the gap from the nearest edge.
    const next = nextEdge.vertices().filter(v => {
      return !vertex.same(current, v);
    })[0];

    return next;
  }

  _getPossibleEdges(v) {
    const regular = this._vTree.at(v) || {edges: []};
    const subsected = this._subsectTree.at(v) || {edges: []};
    const original = regular.edges;
    const derived = subsected.edges.filter(edge => {
      const same = (compare) => { return edges.same(edge, compare); };
      return !original.some(same);
    });
    //if (this.doLog) console.log('v', v);
    //if (this.doLog) console.log('original', original);
    //if (this.doLog) console.log('subsected', subsected.edges);
    //if (this.doLog) console.log('derived', derived);
    return this._removeDuplicateEdges(original).concat(derived);
  }

  _removeDuplicateEdges(bundle) {
    return bundle.filter((edge, i, all) => {
      return !all.some((compare, j) => {
        const same = edges.same(edge, compare) && i != j;
        return same;
      });
    });
  }

  _nearestEdge(to, bundle) {
    //if (this.doLog) console.log('to', to);
    //if (this.doLog) console.log('bundle', bundle);
    bundle.sort((a, b) => {
      if (a.angle() < b.angle()) {
        return -1;
      } else if (a.angle() == b.angle() && a.angle() == 0) {
        if (vertex.same(a.right(), b.left())) {
          return 1;
        } else if (vertex.same(b.right(), a.left())) {
          return -1;
        } else {
          return (a.length() < b.length()) ? -1 : 1;
        }
      } else if (a.angle() == b.angle() && a.angle() == Math.PI/2) {
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
    for (let i = 0; i < bundle.length; i++) {
      if (to.angle() < bundle[i].angle()) {
        nextIndex = i;
        break;
      }
    }
    return bundle[nextIndex];
  }

}
