import { glyphMap, GlyphLayer, romajiTokens } from "./glyphs";
import { glyphVectors, GlyphVector } from "./glyphVectors";

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

export function parseInput(value: string): ParsedInput {
  const layers: GlyphLayer[] = [];
  const labels: string[] = [];
  const invalid: string[] = [];
  const chunks = value.trim().split(/\s+/).filter(Boolean);

  if (chunks.length === 0) {
    return { layers, labels, invalid };
  }

  for (const chunk of chunks) {
    if (glyphMap[chunk]) {
      layers.push(glyphMap[chunk]);
      labels.push(chunk);
      continue;
    }

    if (containsKana(chunk)) {
      for (const char of Array.from(chunk)) {
        const layer = glyphMap[char];
        if (layer) {
          layers.push(layer);
          labels.push(char);
        } else if (!isIgnoredPunctuation(char)) {
          invalid.push(char);
        }
      }
      continue;
    }

    parseRomajiChunk(chunk.toLowerCase(), layers, labels, invalid);
  }

  return { layers, labels, invalid: Array.from(new Set(invalid)) };
}

export async function renderGlyphs(
  layers: GlyphLayer[],
  direction: Direction,
  crop: number,
  target: HTMLCanvasElement,
): Promise<void> {
  const spacingOverlap = Math.max(0, Math.min(48, crop));
  const step = Math.max(24, glyphSize - spacingOverlap * 2);
  const length = layers.length;
  const axisLength = length > 0 ? glyphSize + step * (length - 1) : glyphSize;
  const width = direction === "horizontal" ? axisLength : glyphSize;
  const height = direction === "horizontal" ? glyphSize : axisLength;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  target.width = width * dpr;
  target.height = height * dpr;
  target.style.width = `${width}px`;
  target.style.height = `${height}px`;

  const context = target.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  for (const [index, layer] of layers.entries()) {
    const x = direction === "horizontal" ? index * step : 0;
    const y = direction === "horizontal" ? 0 : index * step;
    drawLayer(context, layer, x, y, direction);
  }
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = "hunter-text.png"): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
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
      invalid.push(chunk.slice(cursor));
      break;
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

function containsKana(value: string): boolean {
  return /[\u3040-\u30ff]/u.test(value);
}

function isIgnoredPunctuation(value: string): boolean {
  return /[、。，,!?！？]/u.test(value);
}
