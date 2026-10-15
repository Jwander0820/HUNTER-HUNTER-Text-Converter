import { glyphMap, romajiTokens } from "./glyphs.ts";
import type { GlyphLayer } from "./glyphs.ts";
import { glyphVectors } from "./glyphVectors.ts";
import type { GlyphVector } from "./glyphVectors.ts";

export type Direction = "horizontal" | "vertical";

export type ParsedInput = {
  layers: GlyphLayer[];
  labels: string[];
  invalid: string[];
};

const glyphSize = 160;
const markSize = 30;
const markHorizontal = { x: 130, y: 91 };
const markVertical = { x: 0, y: 91 };
const pathCache = new Map<string, Path2D>();
export const MAX_INPUT_LENGTH = 2000;
export const MAX_GLYPHS = 100;
// A conservative per-axis limit also accommodates iOS canvas limits.
export const MAX_CANVAS_SIDE = 4096;

export function parseInput(value: string): ParsedInput {
  if (value.length > MAX_INPUT_LENGTH) {
    throw new Error(`輸入過長，請縮短至 ${MAX_INPUT_LENGTH} 個字元以內。`);
  }

  const layers: GlyphLayer[] = [];
  const labels: string[] = [];
  const invalid: string[] = [];
  const chunks = value.normalize("NFKC").toLowerCase().split(/[\s、。，,!?！？]+/u).filter(Boolean);

  if (chunks.length === 0) {
    return { layers, labels, invalid };
  }

  for (const chunk of chunks) {
    if (glyphMap[chunk]) {
      layers.push(glyphMap[chunk]);
      labels.push(chunk);
      continue;
    }

    // Parse roman runs independently so kaあ and ka あ have the same meaning.
    for (const part of chunk.match(/[a-z]+|[^a-z]/gu) ?? []) {
      if (/^[a-z]+$/.test(part)) {
        parseRomajiChunk(part, layers, labels, invalid);
      } else {
        const layer = glyphMap[part];
        if (layer) {
          layers.push(layer);
          labels.push(part);
        } else {
          invalid.push(part);
        }
      }
    }
  }

  if (layers.length > MAX_GLYPHS) {
    throw new Error(`文字過長，一次最多轉換 ${MAX_GLYPHS} 個字圖。`);
  }

  return { layers, labels, invalid: Array.from(new Set(invalid)) };
}

export function getCanvasLayout(length: number, direction: Direction, crop: number, deviceScale = 1) {
  if (!Number.isInteger(length) || length < 0 || length > MAX_GLYPHS) {
    throw new Error(`文字過長，一次最多轉換 ${MAX_GLYPHS} 個字圖。`);
  }
  if (!Number.isFinite(crop) || !Number.isFinite(deviceScale)) {
    throw new Error("無法使用目前的圖片尺寸設定。");
  }
  const spacingOverlap = Math.max(0, Math.min(48, crop));
  const step = glyphSize - spacingOverlap * 2;
  const axisLength = length > 0 ? glyphSize + step * (length - 1) : glyphSize;
  if (axisLength > MAX_CANVAS_SIDE) {
    throw new Error("圖片過長，請縮短文字或增加字距重疊。");
  }
  const width = direction === "horizontal" ? axisLength : glyphSize;
  const height = direction === "horizontal" ? glyphSize : axisLength;
  // Keep at least the normal resolution; only reduce extra high-DPI scaling.
  const scale = Math.min(Math.max(1, Math.min(2, deviceScale)), MAX_CANVAS_SIDE / axisLength);
  return { width, height, step, scale };
}

export function renderGlyphs(
  layers: GlyphLayer[],
  direction: Direction,
  crop: number,
  target: HTMLCanvasElement,
): void {
  const { width, height, step, scale } = getCanvasLayout(layers.length, direction, crop, window.devicePixelRatio || 1);

  target.width = Math.floor(width * scale);
  target.height = Math.floor(height * scale);
  target.style.width = `${width}px`;
  target.style.height = "auto";

  const context = target.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.setTransform(target.width / width, 0, 0, target.height / height, 0, 0);
  context.clearRect(0, 0, width, height);

  for (const [index, layer] of layers.entries()) {
    const x = direction === "horizontal" ? index * step : 0;
    const y = direction === "horizontal" ? 0 : index * step;
    drawLayer(context, layer, x, y, direction);
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = "hunter-text.png"): void {
  const url = canvas.toDataURL("image/png");
  if (!url.startsWith("data:image/png;base64,")) {
    throw new Error("PNG 產生失敗，請縮短文字後重試。");
  }
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
}

function parseRomajiChunk(
  chunk: string,
  layers: GlyphLayer[],
  labels: string[],
  invalid: string[],
): void {
  let cursor = 0;

  while (cursor < chunk.length) {
    const matched = romajiTokens.find((token) => chunk.startsWith(token, cursor));
    if (!matched) {
      invalid.push(chunk[cursor]);
      cursor += 1;
      continue;
    }

    layers.push(glyphMap[matched]);
    labels.push(matched);
    cursor += matched.length;
  }
}

function drawLayer(
  context: CanvasRenderingContext2D,
  layer: GlyphLayer,
  x: number,
  y: number,
  direction: Direction,
): void {
  drawVector(context, layer[0], x, y, glyphSize, glyphSize);

  if (!layer[1]) {
    return;
  }

  const offset = direction === "horizontal" ? markHorizontal : markVertical;
  drawVector(context, layer[1], x + offset.x, y + offset.y, markSize, markSize);
}

function drawVector(
  context: CanvasRenderingContext2D,
  filename: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const vector = glyphVectors[filename];
  if (!vector) {
    throw new Error(`Missing glyph vector: ${filename}`);
  }

  context.save();
  context.translate(x, y);
  context.scale(width / vector.width, height / vector.height);
  context.fillStyle = "#000000";
  context.fill(getPath(filename, vector), "evenodd");
  context.restore();
}

function getPath(filename: string, vector: GlyphVector): Path2D {
  const cached = pathCache.get(filename);
  if (cached) {
    return cached;
  }

  const path = new Path2D(vector.path);
  pathCache.set(filename, path);
  return path;
}
