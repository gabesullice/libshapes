import * as edges from "../lib/Edge";

export default class Composition {

  constructor(options) {
    if (options === undefined) {
      this.bounds([0,0], [100,100]);
    } else {
      this.bounds.apply(this, options.bounds);
    }
    this._count = 0;
    this._figures = {};
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

  add(figure) {
    const id = this._getID();
    this._figures[id] = figure;
    return id;
  }

  remove(id) {
    return delete this._figures[id];
  }

  get(id) {
    return (this._figures.hasOwnProperty(id)) ? this._figures[id] : null;
  }

  overlapping() {
    const pairs = this._findPairs((a, b) => {
      let same = true;
      // Check all edge combinations.
      // @todo: optimize this so that it doesn't run each check twice.
      a.edges().forEach(ea => {
        b.edges().forEach(eb => {
          console.log(ea, eb);
          if (edges.intersect(ea, eb)) {
            console.log('intersecting');
            return true;
          }
            //console.log('not intersecting');
          if (!same && !edges.same(ea, eb)) {
            same = false;
          }
        });
      });
      return !same;
    });
    return Object.keys(pairs);
  }

  _findPairs(paired) {
    const pairs = {};
    const figures = this.figures();
    console.log(figures);
    const figureNames = Object.getOwnPropertyNames(figures);
    figureNames.forEach(idA => {
      figureNames.forEach(idB => {
        if (!pairs.hasOwnProperty(idB) || !pairs[idB].includes(idA)) {
          const A = figures[idA], B = figures[idB];
          if (paired(A, B)) {
            insertPair(pairs, idA, idB);
          }
        }
      })
    });
    return pairs;
  }

  _getID() {
    const id = "fig-" + this._count;
    this._count++;
    return id;
  }

}

function insertPair(pairs, a, b) {
  if (!pairs[a]) {
    pairs[a] = [b];
  } else {
    pairs[a].push(b);
  }
  if (!pairs[b]) {
    pairs[b] = [a];
  } else {
    pairs[b].push(a);
  }
}
