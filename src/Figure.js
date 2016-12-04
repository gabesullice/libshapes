export default class Figure {

  constructor(values) {
    this._shape = values.shape;
    this._position = values.position === undefined ? [0,0] : values.position;
    this._rotation = values.rotation === undefined ? 0 : values.rotation;
    this.compute()
  }

  vertices() {
    return this._computed.vertices();
  }

  compute() {
    this._computed =
      this._shape
      .rotate(this._rotation)
      .translate(this._position);
  }

}
