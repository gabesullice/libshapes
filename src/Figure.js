export default class Figure {

  constructor(values) {
    this._shape = values.shape;
    this._position = values.position === undefined ? [0,0] : values.position;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this._compute()
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
    this._position[0] += offset[0];
    this._position[1] += offset[1];
    this._compute();
    return this._position;
  }

  rotation(angle) {
    this._rotation = angle;
    this._compute();
  }

  _compute() {
    this._computed =
      this._shape
      .rotate(this._rotation)
      .translate(this._position);
  }

}
