# HUNTER×HUNTER Text Converter

## 功能

- 支援平假名、片假名與常見羅馬拼音音節。
- 支援橫排與直排預覽。
- 支援調整字距裁切。
- 支援透明背景 PNG 下載。
- 無法解析的輸入會在畫面上提示。
- 支援半形假名、全形羅馬拼音與分離的濁音符號自動正規化。
- 可切換透明格線、查看 PNG 像素尺寸，並一鍵清空輸入。
- 桌面與手機預覽維持字形比例；透明格線不會出現在下載圖片中。

不支援中文翻譯。未支援的字元會略過並提示；過長的輸出會提示縮短輸入，避免超出 Canvas 尺寸限制。

## 可用輸入範例

```text
ha n - ta ha n - ta
テキストコンバータ
かわいいね-
pa pi pu pe po
```

羅馬拼音建議用空格分隔音節，例如 `ha n ta`。日文假名可以直接連續輸入。

可混用假名與羅馬音，例如 `kaあ`。輸入會先做 Unicode NFKC 正規化，支援半形假名、全形英字及分離的濁音符號；未支援的字元會逐字略過並提示，其餘可辨識的音節仍會轉換。

每次輸入最多 2,000 個字元、100 個字圖，且圖片任一邊不得超過 4,096 像素。實際可容納字數取決於字距重疊：預設 25 可容納 36 個字圖，設為 48 可容納 62 個。高 DPI 裝置會在此範圍內調整輸出倍率；超限時會提示縮短文字或增加重疊，並停用下載。

## 本機開發

使用 Node.js 24 與 pnpm 11.7.0（版本記錄於 `package.json`）。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

執行回歸測試並建置靜態網站：

```bash
pnpm test
pnpm build
```

建置結果會輸出到 `dist/`，可用 `pnpm preview` 預覽。GitHub Pages 工作流程也會先執行測試，再建置與部署。

## 字圖素材與 Python 工具

一般網頁開發與建置直接使用已提交的 `src/glyphVectors.ts`，不需要 Python 或解壓素材。只有維護原始字圖或執行舊版工具時，才需要 Python 3.12 以上。

在專案根目錄執行以下 PowerShell 指令：

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m zipfile -e text_img/text_img.zip text_img
.venv\Scripts\python.exe -m unittest discover -s tests -p "test_python_tools.py" -v
```

素材 ZIP 內的 PNG 應直接放在 `text_img/` 下。需要重新生成向量時執行：

```powershell
.venv\Scripts\python.exe scripts/generate_glyph_vectors.py
```

生成器會先確認來源完整、有可見圖形，再覆寫 `src/glyphVectors.ts`；空資料夾或缺少字圖時會報錯並保留原檔。更新向量後請再次執行 `pnpm test` 與 `pnpm build`。

## 舊版 Python 說明
### 獵人文字轉換器
### ハンター×ハンター テキストコンバーター

![Hunter x Hunter](https://github.com/Jwander0820/HUNTER-HUNTER-Text-Converter/blob/master/data/HunterxHunter.png)

![Text Converter](https://github.com/Jwander0820/HUNTER-HUNTER-Text-Converter/blob/master/data/TextConverter.png)


*一個簡易的獵人文字轉換器/生成器*

---
## Requirements
- Python 3.12 以上
- OpenCV、Pillow、NumPy（依 `requirements.txt` 安裝）

## 使用方法
在 main.py 文件中, 您可以看到以下範例:

1. 設定想寫的文字(texts)

    texts = ['ha', 'n', "-", "ta", 'ha', 'n', "-", "ta"]  # Hunter x Hunter/ハンター×ハンター

2. 設定文字的方向，垂直or水平(direction)

3. padding參數用於決定文字間隔，安全邊際建議padding值不超過35

4. 最後生成一張具有透明底圖，黑色獵人文字的圖片，可以使用預設提供的PIL方法儲存圖片

完成上方安裝與解壓步驟後，可用 `.venv\Scripts\python.exe main.py` 執行範例。預設素材目錄固定為專案內的 `text_img/`，不受啟動時工作目錄影響。

### 補充
- 橫寫時濁音和半濁音符號要擺在右下角
- 直寫時則擺在左下角
- 促音和拗音一樣跟日文一樣是小寫
