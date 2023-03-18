import cv2
from core.generate_text import GenerateText
from PIL import Image

if __name__ == '__main__':
    # 使用範例
    texts = ['ha', 'n', "-", "ta", 'ha', 'n', "-", "ta"]  # Hunter x Hunter/ハンター×ハンター
    texts = ['te', 'ki', "su", "to", 'ko', 'n', 'ba', "ta"]  # 文字轉換器/Text Converter/テキストコンバーター
    texts = ['ka', 'wa', 'i', 'ne', '-']  # 可愛/cute/かわいい

    direction = 'horizontal'  # 'horizontal' 或 'vertical'
    result_image = GenerateText().concatenate_images(texts, direction, padding=25)

    # 將 OpenCV 圖片轉換為 PIL 圖片
    result_image_pil = Image.fromarray(cv2.cvtColor(result_image, cv2.COLOR_BGRA2RGBA))
    # 顯示具有透明度的圖片
    result_image_pil.show()
    # 儲存圖片
    # result_image_pil.save("test.png")