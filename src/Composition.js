import * as edges from "../lib/Edge";
import * as figures from "../lib/Figure";

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
    const figs = this.figures();
    const found = [];
    for (var k0 in figs) {
      for (var k1 in figs) {
        if (!found.includes(k1)) {
          if (figures.overlap(figs[k0], figs[k1])) {
            if (!found.includes(k0)) found.push(k0);
            if (!found.includes(k1)) found.push(k1);
          }
        }
      }
    }
    return found;
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
