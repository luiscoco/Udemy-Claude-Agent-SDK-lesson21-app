import test from "node:test";
import assert from "node:assert/strict";
import {add} from "./utils.js";
test("adds positive values",()=>assert.equal(add(2,3),5));
test("adds a negative value",()=>assert.equal(add(-3,2),-1));
