import * as vertex from "./Vertex.js";

export default class Shape {

  constructor(points) {
    this._vertices = [];
    points.forEach((point, index) => {
      this._vertices[index] = new vertex.Vertex(point[0], point[1]);
    });
  }

  vertices() {
    return this._vertices;
  }

  rotate(angle) {
    return new Shape(this._vertices.map(v => {
      const rotated = vertex.rotate(v, angle);
      return [rotated.x, rotated.y];
    }));
  }

  shift(shift) {
    return new Shape(this._vertices.map(v => {
      const shifted = vertex.shift(v, shift);
      return [shifted.x, shifted.y];
    }));
  }

}
