# Hunter x Hunter Text Converter
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
