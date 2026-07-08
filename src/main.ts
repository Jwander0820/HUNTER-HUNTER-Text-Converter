import { downloadCanvas, parseInput, renderGlyphs, Direction } from "./converter";
import "./styles.css";

type AppState = {
  direction: Direction;
  crop: number;
  input: string;
};

const examples = ["ha n - ta ha n - ta", "テキストコンバータ", "かわいいね-", "pa pi pu pe po"];

const state: AppState = {
  direction: "horizontal",
  crop: 25,
  input: "ha n - ta ha n - ta",
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <main class="shell">
    <section class="workbench" aria-labelledby="app-title">
      <div class="intro">
        <p class="eyebrow">Nen script converter</p>
        <h1 id="app-title">HUNTER×HUNTER Text Converter</h1>
      </div>

      <div class="tool-grid">
        <section class="controls" aria-label="文字設定">
          <label class="field-label" for="source-text">輸入文字</label>
          <textarea
            id="source-text"
            class="source-input"
            autocomplete="off"
            spellcheck="false"
            rows="8"
          ></textarea>

          <div class="example-row" aria-label="範例">
            ${examples.map((example) => `<button class="example-button" type="button" data-example="${example}">${example}</button>`).join("")}
          </div>

          <div class="control-block">
            <span class="field-label">排列</span>
            <div class="segmented" role="group" aria-label="排列方向">
              <button class="segment" type="button" data-direction="horizontal">橫排</button>
              <button class="segment" type="button" data-direction="vertical">直排</button>
            </div>
          </div>

          <div class="control-block">
            <div class="range-label">
              <label class="field-label" for="crop-range">字距重疊</label>
              <output id="crop-value" for="crop-range">25</output>
            </div>
            <input id="crop-range" class="range" type="range" min="0" max="48" step="1" />
          </div>

          <div class="status" aria-live="polite">
            <p id="status-text"></p>
            <div id="token-list" class="token-list" aria-label="解析結果"></div>
          </div>
        </section>

        <section class="preview-panel" aria-label="輸出預覽">
          <div class="paper">
            <canvas id="preview-canvas" aria-label="獵人文字圖片預覽"></canvas>
            <p id="empty-state" class="empty-state">輸入可轉換的假名或羅馬拼音</p>
          </div>

          <div class="action-row">
            <button id="download-button" class="download-button" type="button">下載 PNG</button>
          </div>
        </section>
      </div>
    </section>
  </main>
`;

const input = requireElement<HTMLTextAreaElement>("#source-text");
const cropRange = requireElement<HTMLInputElement>("#crop-range");
const cropValue = requireElement<HTMLOutputElement>("#crop-value");
const statusText = requireElement<HTMLParagraphElement>("#status-text");
const tokenList = requireElement<HTMLDivElement>("#token-list");
const canvas = requireElement<HTMLCanvasElement>("#preview-canvas");
const emptyState = requireElement<HTMLParagraphElement>("#empty-state");
const downloadButton = requireElement<HTMLButtonElement>("#download-button");
const directionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-direction]"));
const exampleButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-example]"));

input.value = state.input;
cropRange.value = String(state.crop);

input.addEventListener("input", () => {
  state.input = input.value;
  void updatePreview();
});

cropRange.addEventListener("input", () => {
  state.crop = Number(cropRange.value);
  void updatePreview();
});

directionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.direction = button.dataset.direction as Direction;
    void updatePreview();
  });
});

exampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextValue = button.dataset.example ?? "";
    state.input = nextValue;
    input.value = nextValue;
    input.focus();
    void updatePreview();
  });
});

downloadButton.addEventListener("click", () => {
  if (downloadButton.disabled) {
    return;
  }

  downloadCanvas(canvas);
});

void updatePreview();

async function updatePreview(): Promise<void> {
  cropValue.value = String(state.crop);
  directionButtons.forEach((button) => {
    const isActive = button.dataset.direction === state.direction;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const parsed = parseInput(state.input);
  const hasGlyphs = parsed.layers.length > 0;

  tokenList.innerHTML = parsed.labels
    .map((label) => `<span class="token">${escapeHtml(label)}</span>`)
    .join("");

  emptyState.hidden = hasGlyphs;
  canvas.hidden = !hasGlyphs;
  downloadButton.disabled = !hasGlyphs;

  if (!hasGlyphs) {
    statusText.textContent = "等待可轉換的輸入";
    clearCanvas();
    return;
  }

  if (parsed.invalid.length > 0) {
    statusText.textContent = `未支援：${parsed.invalid.join("、")}`;
  } else {
    statusText.textContent = `${parsed.labels.length} 個字圖已就緒`;
  }

  try {
    await renderGlyphs(parsed.layers, state.direction, state.crop, canvas);
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "預覽產生失敗";
    downloadButton.disabled = true;
  }
}

function clearCanvas(): void {
  const context = canvas.getContext("2d");
  context?.clearRect(0, 0, canvas.width, canvas.height);
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing UI element: ${selector}`);
  }

  return element;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
