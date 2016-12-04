export const EPSILON = 0.0000001;
 
export class Vertex {

  constructor(x, y) {
    this.x = x
    this.y = y
  }

}

export function same(va, vb) {
  return distance(va, vb) <= EPSILON;
}

export function distance(va, vb) {
  return Math.sqrt(
    Math.pow(Math.abs(va.x - vb.x), 2) + Math.pow(Math.abs(va.y - vb.y), 2)
  );
}

export function rotate(v, angle) {
  return new Vertex(
    (v.x * Math.cos(angle)) - (v.y * Math.sin(angle)),
    (v.x * Math.sin(angle)) + (v.y * Math.cos(angle)),
  );
}

export function translate(v, translation) {
  return new Vertex(v.x + translation[0], v.y + translation[1]);
}
