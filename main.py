import cv2
from core.generate_text import GenerateText
from PIL import Image

if __name__ == '__main__':
    # 使用範例
    texts = ['ka', 'wa', 'i', "ne"]

    direction = 'horizontal'  # 'horizontal' 或 'vertical'
    result_image = GenerateText().concatenate_images(texts, direction, padding=25)

    # 將 OpenCV 圖片轉換為 PIL 圖片
    result_image_pil = Image.fromarray(cv2.cvtColor(result_image, cv2.COLOR_BGRA2RGBA))
    # 顯示具有透明度的圖片
    result_image_pil.show()
    # 儲存圖片
    # result_image_pil.save("test.png")