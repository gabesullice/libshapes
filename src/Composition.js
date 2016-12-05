export default class Composition {

  constructor(options) {
    this._bounds = options === undefined ? [100,100] : options.bounds;
    this._count = 0;
    this._figures = {};
  }

  figures() {
    return this._figures;
  }

  bounds(values) {
    if (values !== undefined) {
      this._bounds = values;
    }
    return this._bounds;
  }

  add(figure) {
    const id = this._getID();
    this._figures[id] = figure;
    return id;
  }

  remove(id) {
    return delete this._figures[id];
  }

  _getID() {
    const id = "fig-" + this._count;
    this._count++;
    return id;
  }

}
