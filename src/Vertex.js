const EPSILON = 0.0000001;
 
export class Vertex {

  constructor(x, y) {
    this.x = x
    this.y = y
  }

}

export function same(va, vb) {
  const xeq = (Math.abs(va.x - vb.x) <= EPSILON);
  const yeq = (Math.abs(va.y - vb.y) <= EPSILON);
  return xeq && yeq;
}

export function rotate(v, angle) {
  return new Vertex(
    (v.x * Math.cos(angle)) - (v.y * Math.sin(angle)),
    (v.x * Math.sin(angle)) + (v.y * Math.cos(angle)),
  );
}
