import test from "ava";
import * as figures from "../lib/Figure";
import Composition from "../lib/Composition";
import ShapeFactory from "../../shapelibrary/lib/ShapeFactory";


test("It should work", t => {
const ShapeMaker = new ShapeFactory({unit: 7.5});

const comp = new Composition({
  snap: false,
  snapTolerance: 0.0115,
});

const tri = ShapeMaker.make("equilateral");
const sq = ShapeMaker.make("parallelogram");
//console.log('tri:', tri);
//console.log('sq:', sq);

const equitl = new figures.Figure({
  shape: tri,
  position: [10.5,11],
  rotation: Math.PI,
});

const square = new figures.Figure({
  shape: sq,
  //position: [5, 21],
  position: [10.5,14],
  rotation: 0,
});

const eqid = comp.add(equitl);
const sqid = comp.add(square);

//comp.move("fig-", [10.5, 11]);
//comp.move(sqid, [20,30]);
comp.move(sqid, [5,21]);

//console.log(comp);
//console.log(comp._figures);
//console.log(comp._figures['fig-0']._computed._vertices);
//console.log(comp._figures['fig-1']._computed._vertices);
//console.log(comp._figures['fig-1'].position());

const overlapping = comp.overlapping();
//console.log(overlapping);

t.false(overlapping.length > 0);
});

