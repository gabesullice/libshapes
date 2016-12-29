import test from "ava";
import * as figures from "../lib/Figure";
import * as vertex from "../lib/Vertex";
import ShapeFactory from "shape-factory";
import {VertexTree} from "vertex-tree";
import GapFinder from "../lib/utils/GapFinder";

const ShapeMaker = new ShapeFactory();

test("Can find the next vertex from the previous two vertices", t => {
  const square = ShapeMaker.make("square")
  const largeSquare = ShapeMaker.make("square", 3)
  const cases = [
    {
      figures: [{shape: largeSquare}, {shape: square, position: [-1,0]}],
      subtests: [
        {input: [[-0.5,0.5], [-1.5,0.5]], expected: [-1.5,1.5]},
        {input: [[-1.5,0.5], [-1.5,1.5]], expected: [1.5,1.5]},
        {input: [[-1.5,1.5], [1.5,1.5]], expected: [1.5,-1.5]},
        {input: [[1.5,1.5], [1.5,-1.5]], expected: [-1.5,-1.5]},
        {input: [[1.5,-1.5], [-1.5,-1.5]], expected: [-1.5,-0.5]},
        {input: [[-1.5,-1.5], [-1.5,-0.5]], expected: [-0.5,-0.5]},
      ],
    },
    {
      figures: [{shape: largeSquare}, {shape: square, position: [-1,1]}],
      subtests: [
        {input: [[-0.5, 0.5], [-0.5, 1.5]], expected: [ 1.5, 1.5]},
        {input: [[-0.5, 1.5], [ 1.5, 1.5]], expected: [ 1.5,-1.5]},
        {input: [[ 1.5, 1.5], [ 1.5,-1.5]], expected: [-1.5,-1.5]},
        {input: [[ 1.5,-1.5], [-1.5,-1.5]], expected: [-1.5, 0.5]},
        {input: [[-1.5,-1.5], [-1.5, 0.5]], expected: [-0.5, 0.5]},
      ],
    },
    {
      figures: [{shape: largeSquare}, {shape: square, position: [0,1]}],
      subtests: [
        {input: [[ 0.5, 0.5], [ 0.5, 1.5]], expected: [ 1.5, 1.5]},
        {input: [[ 0.5, 1.5], [ 1.5, 1.5]], expected: [ 1.5,-1.5] },
        {input: [[ 1.5, 1.5], [ 1.5,-1.5]], expected: [-1.5,-1.5]},
        {input: [[ 1.5,-1.5], [-1.5,-1.5]], expected: [-1.5, 1.5]},
        {input: [[-1.5,-1.5], [-1.5, 1.5]], expected: [-0.5, 1.5]},
        {input: [[-1.5, 1.5], [-0.5, 1.5]], expected: [-0.5, 0.5]},
        {input: [[-0.5, 1.5], [-0.5, 0.5]], expected: [ 0.5, 0.5]},
      ],
    },
    {
      figures: [
        {shape: largeSquare},
        {shape: square, position: [-1,-1]},
        {shape: square, position: [-1, 0]},
        {shape: square, position: [-1, 1]},
        {shape: square, position: [ 0, 1]},
        {shape: square, position: [ 1, 1]},
        {shape: square, position: [ 1, 0]},
        {shape: square, position: [ 1,-1]},
        {shape: square, position: [ 0,-1]},
      ],
      subtests: [
        {input: [[ 0.5,-0.5], [-0.5,-0.5]], expected: [-0.5, 0.5]},
        {input: [[-0.5,-0.5], [-0.5, 0.5]], expected: [0.5, 0.5]},
        {input: [[-0.5, 0.5], [0.5, 0.5]], expected: [ 0.5,-0.5]},
        {input: [[0.5, 0.5], [ 0.5,-0.5]], expected: [-0.5,-0.5]},
      ],
    }
  ];

  cases.forEach(item => {
    const vertexTree = new VertexTree();
    const subsectTree = new VertexTree();
    const gapFinder = new GapFinder({vertexTree, subsectTree});

    item.figures
      .map(settings => new figures.Figure(settings))
      .forEach((fig0, _, all) => {
        // Insert the figure into the vertexTree.
        fig0.edges().forEach(edge => vertexTree.insertEdge(edge));

        // Insert all subsections into the subsectTree.
        all.forEach(fig1 => {
          figures.subsect(fig0, fig1).forEach(section => {
            subsectTree.insertEdge(section);
          });
        });
      });


    item.subtests.forEach(sub => {
      const input = sub.input.map(point => {
        return new vertex.Vertex(point[0], point[1]);
      });
      const next = gapFinder.nextVertex(...input);
      const actual = [next.x, next.y];
      t.deepEqual(actual, sub.expected);
    });
  });
});
