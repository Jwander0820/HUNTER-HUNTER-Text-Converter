# HUNTER×HUNTER Text Converter

## 功能

- 支援平假名、片假名與常見羅馬拼音音節。
- 支援橫排與直排預覽。
- 支援調整字距裁切。
- 支援透明背景 PNG 下載。
- 無法解析的輸入會在畫面上提示。

## 可用輸入範例

```text
ha n - ta ha n - ta
テキストコンバータ
かわいいね-
pa pi pu pe po
```

羅馬拼音建議用空格分隔音節，例如 `ha n ta`。日文假名可以直接連續輸入。

## 本機開發

```bash
npm install
npm run dev
```

建置靜態網站：

```bash
npm run build
```

建置結果會輸出到 `dist/`。



## 舊版 Python 說明
### 獵人文字轉換器
### ハンター×ハンター テキストコンバーター

![Hunter x Hunter](https://github.com/Jwander0820/HUNTER-HUNTER-Text-Converter/blob/master/data/HunterxHunter.png)

![Text Converter](https://github.com/Jwander0820/HUNTER-HUNTER-Text-Converter/blob/master/data/TextConverter.png)


*一個簡易的獵人文字轉換器/生成器*

---
## Requirements
- Python 3
- OpenCV
- Pillow

## 使用方法
在 main.py 文件中, 您可以看到以下範例:

1. 設定想寫的文字(texts)

    texts = ['ha', 'n', "-", "ta", 'ha', 'n', "-", "ta"]  # Hunter x Hunter/ハンター×ハンター

2. 設定文字的方向，垂直or水平(direction)

3. padding參數用於決定文字間隔，安全邊際建議padding值不超過35

4. 最後生成一張具有透明底圖，黑色獵人文字的圖片，可以使用預設提供的PIL方法儲存圖片

### 補充
- 橫寫時濁音和半濁音符號要擺在右下角
- 直寫時則擺在左下角
- 促音和拗音一樣跟日文一樣是小寫
