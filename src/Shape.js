import { Vertex } from "./Vertex.js";

export default class {

  constructor() {
    const args = Array.from(arguments);
    this._vertices = [];
    args.forEach((arg, index) => {
      this._vertices[index] = new Vertex(arg[0], arg[1]);
    });
  }

  vertices() {
    return this._vertices;
  }

}
