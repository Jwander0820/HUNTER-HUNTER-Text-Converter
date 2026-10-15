import assert from "node:assert/strict";
import { test } from "node:test";
import { downloadCanvas, getCanvasLayout, MAX_CANVAS_SIDE, MAX_GLYPHS, MAX_INPUT_LENGTH, parseInput } from "../src/converter.ts";
import { glyphMap } from "../src/glyphs.ts";
import { glyphVectors } from "../src/glyphVectors.ts";

test("documented examples and aliases remain supported", () => {
  for (const input of ["ha n - ta ha n - ta", "テキストコンバータ", "かわいいね-", "pa pi pu pe po", "SI TI TU HU XA XYU XTU"]) {
    const result = parseInput(input);
    assert.ok(result.layers.length > 0);
    assert.deepEqual(result.invalid, []);
  }
});

test("empty input and unsupported text remain distinguishable", () => {
  assert.deepEqual(parseInput(" \n\t "), { layers: [], labels: [], invalid: [] });
  const result = parseInput("漢字");
  assert.equal(result.layers.length, 0);
  assert.ok(result.invalid.length > 0);
});

test("prototype names cannot become glyph layers", () => {
  for (const input of ["constructor", "__proto__", "toString", "valueOf", "hasOwnProperty"]) {
    assert.equal(glyphMap[input], undefined);
    const result = parseInput(input);
    assert.ok(result.invalid.length > 0);
    assert.ok(result.layers.every(Array.isArray));
    for (const layer of result.layers) assert.ok(glyphVectors[layer[0]]);
  }
});

test("NFC-equivalent kana produce identical glyphs", () => {
  assert.deepEqual(parseInput("か\u3099は\u309a"), parseInput("がぱ"));
});

test("mixed scripts and ignored punctuation preserve valid syllables", () => {
  assert.deepEqual(parseInput("KAあき"), parseInput("ka あ き"));
  assert.deepEqual(parseInput("ka,ki！く。"), parseInput("ka ki く"));
  assert.deepEqual(parseInput(". - ~ ー").invalid, []);
  assert.equal(parseInput(". - ~ ー").layers.length, 4);
});

test("unsupported roman letters are reported while later valid syllables survive", () => {
  assert.deepEqual(parseInput("kya").invalid, ["k"]);
  assert.deepEqual(parseInput("kya").labels, ["ya"]);
  assert.deepEqual(parseInput("kaXYZ").labels, ["ka"]);
  assert.deepEqual(parseInput("kaXYZ").invalid, ["x", "y", "z"]);
  assert.deepEqual(parseInput("kaqki").labels, ["ka", "ki"]);
});

test("every registered glyph resolves to nonempty vector geometry", () => {
  for (const [key, layers] of Object.entries(glyphMap)) {
    assert.deepEqual(parseInput(key).layers, [layers], key);
    for (const file of layers) {
      const vector = glyphVectors[file];
      assert.ok(vector?.path.length > 0, file);
      assert.ok(vector.width > 0 && vector.height > 0, file);
    }
  }
});

test("large input is rejected before generating unbounded output", () => {
  assert.throws(() => parseInput(" ".repeat(MAX_INPUT_LENGTH + 1)), /輸入過長/);
  assert.throws(() => parseInput("あ".repeat(MAX_GLYPHS + 1)), /文字過長/);
  assert.throws(() => getCanvasLayout(300, "horizontal", 25, 2), /文字過長/);
});

test("normal dimensions and vertical marks use a consistent layout", () => {
  assert.deepEqual(getCanvasLayout(8, "horizontal", 25, 2), { width: 930, height: 160, step: 110, scale: 2 });
  assert.deepEqual(getCanvasLayout(8, "vertical", 25, 2), { width: 160, height: 930, step: 110, scale: 2 });
});

test("high DPI is bounded while normal resolution is preserved", () => {
  for (const direction of ["horizontal", "vertical"] as const) {
    const layout = getCanvasLayout(36, direction, 25, 3);
    assert.ok(layout.scale >= 1);
    assert.ok(Math.floor(layout.width * layout.scale) <= MAX_CANVAS_SIDE);
    assert.ok(Math.floor(layout.height * layout.scale) <= MAX_CANVAS_SIDE);
    assert.throws(() => getCanvasLayout(37, direction, 25, 1), /圖片過長/);
  }
  assert.throws(() => getCanvasLayout(1, "horizontal", NaN), /尺寸設定/);
});

test("failed PNG encoding never starts a fake download", () => {
  const canvas = { toDataURL: () => "data:," } as HTMLCanvasElement;
  assert.throws(() => downloadCanvas(canvas), /PNG 產生失敗/);
});
