import { downloadCanvas, parseInput, renderGlyphs } from "./converter.ts";
import type { Direction, ParsedInput } from "./converter.ts";
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
let lastParsedText: string | undefined;
let parsed: ParsedInput = { layers: [], labels: [], invalid: [] };

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <main class="shell">
    <section class="workbench" aria-labelledby="app-title">
      <div class="intro">
        <div class="brand-mark" aria-hidden="true">H<span>×</span>H</div>
        <h1 id="app-title">HUNTER×HUNTER Text Converter</h1>
      </div>

      <div class="tool-grid">
        <section class="controls" aria-label="文字設定">
          <div class="section-heading"><label class="field-label" for="source-text">輸入文字</label><button id="clear-button" class="text-button" type="button">清空</button></div>
          <textarea
            id="source-text"
            class="source-input"
            autocomplete="off"
            spellcheck="false"
            rows="4"
            aria-describedby="input-help"
            placeholder="試試 ハンター 或 ha n - ta"
          ></textarea>
          <p id="input-help" class="helper">支援平假名、片假名與羅馬拼音，不支援中文翻譯。拼音可用空格分隔音節。</p>

          <p class="small-label">試用範例</p>
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
            <div class="range-hints"><span>寬鬆</span><span>緊密</span></div>
          </div>

          <div class="status" aria-live="polite">
            <p id="status-text"></p>
            <div id="token-list" class="token-list" aria-label="解析結果"></div>
          </div>
        </section>

        <section class="preview-panel" aria-label="輸出預覽">
          <div class="preview-heading"><div><p class="eyebrow">YOUR HUNTER SCRIPT</p><h2>文字預覽</h2></div><span class="live-badge">即時轉換</span></div>
          <div class="preview-toolbar"><span id="image-size">準備預覽</span><button id="background-button" class="text-button" type="button" aria-pressed="false">顯示透明格線</button></div>
          <div class="paper">
            <canvas id="preview-canvas" aria-label="獵人文字圖片預覽"></canvas>
            <p id="empty-state" class="empty-state">輸入可轉換的假名或羅馬拼音</p>
          </div>

          <div class="action-row">
            <p class="export-note">透明背景 PNG<span>可用於設計、筆記與收藏</span></p>
            <button id="download-button" class="download-button" type="button"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>下載 PNG</button>
          </div>
        </section>
      </div>
    </section>
    <footer><span>HUNTER × HUNTER · 文字轉換工具</span><span>所有轉換皆在你的裝置上完成</span></footer>
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
const clearButton = requireElement<HTMLButtonElement>("#clear-button");
const backgroundButton = requireElement<HTMLButtonElement>("#background-button");
const imageSize = requireElement<HTMLSpanElement>("#image-size");
const paper = requireElement<HTMLDivElement>(".paper");

clearButton.addEventListener("click", () => {
  state.input = input.value = "";
  input.focus();
  void updatePreview();
});
backgroundButton.addEventListener("click", () => {
  const active = paper.classList.toggle("is-transparent");
  backgroundButton.setAttribute("aria-pressed", String(active));
  backgroundButton.textContent = active ? "隱藏透明格線" : "顯示透明格線";
});

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

  try {
    downloadCanvas(canvas);
    statusText.textContent = "已準備 PNG 下載";
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "PNG 下載失敗，請重試。";
    statusText.dataset.tone = "warning";
    downloadButton.disabled = true;
  }
});

void updatePreview();

function updatePreview(): void {
  paper.classList.toggle("is-vertical", state.direction === "vertical");
  cropValue.value = String(state.crop);
  directionButtons.forEach((button) => {
    const isActive = button.dataset.direction === state.direction;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  emptyState.textContent = "輸入可轉換的假名或羅馬拼音";
  clearButton.disabled = state.input.length === 0;
  exampleButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.example === state.input)));

  downloadButton.disabled = true;
  try {
    // Changing spacing or direction can reuse parsing and its token DOM.
    if (lastParsedText !== state.input) {
      parsed = parseInput(state.input);
      lastParsedText = state.input;
      tokenList.innerHTML = parsed.labels
        .map((label) => `<span class="token">${escapeHtml(label)}</span>`)
        .join("");
    }
    const hasGlyphs = parsed.layers.length > 0;
    statusText.dataset.tone = parsed.invalid.length ? "warning" : "success";
    emptyState.hidden = hasGlyphs;
    canvas.hidden = !hasGlyphs;

    if (!hasGlyphs) {
      statusText.textContent = parsed.invalid.length ? `未支援：${parsed.invalid.join("、")}。請輸入假名或羅馬拼音。` : "輸入文字，開始轉換";
      imageSize.textContent = "尚無圖片";
      clearCanvas();
      return;
    }
    statusText.textContent = parsed.invalid.length
      ? `已轉換 ${parsed.labels.length} 個字圖；略過未支援字元：${parsed.invalid.join("、")}`
      : `${parsed.labels.length} 個字圖已就緒`;
    renderGlyphs(parsed.layers, state.direction, state.crop, canvas);
    imageSize.textContent = `${canvas.width} × ${canvas.height} px`;
    downloadButton.disabled = false;
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "預覽產生失敗";
    lastParsedText = undefined;
    tokenList.replaceChildren();
    statusText.dataset.tone = "warning";
    canvas.hidden = true;
    emptyState.hidden = false;
    emptyState.textContent = statusText.textContent;
    imageSize.textContent = "無法產生圖片";
    clearCanvas();
  }
}

function clearCanvas(): void {
  // Release the old bitmap and prevent stale output after invalid/oversized input.
  canvas.width = 1;
  canvas.height = 1;
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
