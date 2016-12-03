import * as vertex from "./Vertex";
import { Edge } from "./Edge";

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

  edges() {
    return this._vertices.reduce((edges, v, i, arr) => {
      // If this is the first vertex, create an edge to join it with the last.
      const next = (i == arr.length - 1) ? arr[0] : arr[i + 1];
      edges.push(new Edge([[v.x, v.y], [next.x, next.y]]));
      return edges;
    }, []);
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
