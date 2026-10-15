import assert from "node:assert/strict";
import test from "node:test";
import { parseInput } from "../src/converter.ts";

test("kana and romaji produce the same glyphs including voice marks", () => {
  assert.deepEqual(parseInput("パピプペポ").layers, parseInput("pa pi pu pe po").layers);
  assert.deepEqual(parseInput("はんたー").layers, parseInput("ha n ta -").layers);
});

test("normalizes half-width kana, decomposed marks and full-width romaji", () => {
  assert.deepEqual(parseInput("ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ").layers, parseInput("パピプペポ").layers);
  assert.deepEqual(parseInput("か\u3099").layers, parseInput("が").layers);
  assert.deepEqual(parseInput("ＨＡ Ｎ").layers, parseInput("ha n").layers);
});

test("continues after unsupported symbols and ignores punctuation consistently", () => {
  assert.deepEqual(parseInput("ka!ki").labels, ["ka", "ki"]);
  const parsed = parseInput("ka💚ki💚");
  assert.deepEqual(parsed.labels, ["ka", "ki"]);
  assert.deepEqual(parsed.invalid, ["💚"]);
});

test("handles empty, unsupported and object prototype names without bogus glyphs", () => {
  assert.deepEqual(parseInput(" \n "), { layers: [], labels: [], invalid: [] });
  assert.deepEqual(parseInput("中文").invalid, ["中", "文"]);
  for (const input of ["constructor", "__proto__", "toString"]) {
    const parsed = parseInput(input);
    assert.ok(parsed.invalid.length > 0);
    assert.ok(parsed.layers.every(Array.isArray));
  }
});
