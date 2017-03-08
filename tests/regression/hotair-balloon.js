import test from "ava";
import fs from "fs";
import * as composition from "../../lib/Composition";

const history = JSON.parse(fs.readFileSync("tests/data/history-004-hotair-balloon.json"));

test.skip("Diagnose hot air balloon bug", t => {
  const C = composition.fromHistory(history);
  //console.log(C.nonIntegrated());
});
