import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Load the browser's actual TypeScript parser without adding a test framework.
async function moduleUrl(name) {
  const source = await readFile(new URL(`../src/${name}.ts`, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  for (const dependency of ["glyphs", "glyphVectors"]) {
    if (outputText.includes(`"./${dependency}"`)) {
      outputText = outputText.replace(`"./${dependency}"`, JSON.stringify(await moduleUrl(dependency)));
    }
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const { parseInput } = await import(await moduleUrl("converter"));

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
