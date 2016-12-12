import * as edges from "../lib/Edge";

export class Figure {

  constructor(values) {
    this._shape = values.shape;
    this._position = values.position === undefined ? [0,0] : values.position;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this._compute()
  }

  shape() {
    return this._shape;
  }

  vertices() {
    return this._computed.vertices();
  }

  edges() {
    return this._computed.edges();
  }

  position(pos) {
    if (pos !== undefined) {
      this._position = pos;
      this._compute();
    }
    return this._position;
  }

  translate(offset) {
    return this.position([
      this._position[0] + offset[0], this._position[1] + offset[1]
    ]);
  }

  rotation(angle) {
    if (angle !== undefined) {
      this._rotation = angle;
      this._compute();
    }
    return this._rotation;
  }

  rotate(angle) {
    return this.rotation((this._rotation + angle) % (2 * Math.PI));
  }

  _compute() {
    this._computed =
      this._shape
      .rotate(this._rotation)
      .translate(this._position);
  }

}

export function overlap(f0, f1) {
  const e0s = f0.edges(), e1s = f1.edges();
  for (var k0 in e0s) {
    for (var k1 in e1s) {
      if (edges.intersect(e0s[k0], e1s[k1])) return true;
    }
  }
  return false;
}
