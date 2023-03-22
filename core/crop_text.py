import cv2
import numpy as np
import os
from PIL import Image, ImageOps


def crop_text(img_path, limit_length=None, dilate_iter=10):
    """
    裁切圖片(白底)，並生成去背透明圖層，會根據框選出的輪廓做裁切
    使用 limit_length 可以強制指定底圖尺寸大小，若不指定，則會生成裁切的輪廓尺寸*1.2的底圖
    使用 dilate_iter 可以調整膨脹係數，若兩個文字間太靠近，則建議降低膨脹係數，須注意膨脹係數調整太小可能會造成文字獨立的點被分離
    :param img_path: 圖片路徑
    :param limit_length: 指定底圖大小
    :param dilate_iter: 膨脹係數
    :return:
    """
    # 載入圖片
    # image = cv2.imread(img_path)
    image = Image.open(img_path)
    image = image.convert("RGB")
    image = np.uint8(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # 轉換成灰階圖片
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 二值化處理
    threshold_value, threshold_image = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 膨脹操作
    kernel = np.ones((3, 3), np.uint8)
    dilated_image = cv2.dilate(threshold_image, kernel, iterations=dilate_iter)

    # 尋找輪廓
    contours, hierarchy = cv2.findContours(dilated_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 創建img資料夾
    if not os.path.exists('img'):
        os.mkdir('img')

    # 遍歷每個輪廓
    for i, contour in enumerate(contours):
        # 計算輪廓的外接矩形
        x, y, w, h = cv2.boundingRect(contour)

        # 擷取圖片
        extracted_image = image[y:y+h, x:x+w]

        # 擷取二值化圖片作為 alpha 通道
        extracted_alpha = threshold_image[y:y+h, x:x+w]

        # 去背處理
        b, g, r = cv2.split(extracted_image)
        rgba = [b, g, r, extracted_alpha]
        extracted_image_rgba = cv2.merge(rgba, 4)

        # 建立透明底圖
        if limit_length:
            transparent_image = np.zeros((limit_length, limit_length, 4), dtype=np.uint8)
        else:
            transparent_image = np.zeros((int(w*1.2), int(h*1.2), 4), dtype=np.uint8)

        # 計算圖片置中位置
        center_x = int(transparent_image.shape[1] / 2)
        center_y = int(transparent_image.shape[0] / 2)
        offset_x = int(w / 2)
        offset_y = int(h / 2)
        x1 = center_x - offset_x
        y1 = center_y - offset_y
        x2 = x1 + w
        y2 = y1 + h

        # 將圖片置中放置在透明底圖上
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(transparent_image.shape[1], x2)
        y2 = min(transparent_image.shape[0], y2)

        # 擷取圖片的部分可能超出範圍
        extracted_image_rgba = extracted_image_rgba[:y2-y1, :x2-x1]

        transparent_image[y1:y2, x1:x2] = extracted_image_rgba

        # 儲存圖片
        filename = os.path.join('img', f'{i}.png')
        cv2.imwrite(filename, transparent_image)


def process_image(input_image_path, output_image_path):
    """將透明底圖圖片重新縮小至一半，並重新貼到指定位置，用於生成促音的縮小字符"""
    # 輸入圖片
    input_image = Image.open(input_image_path).convert('RGBA')

    # 縮放圖片至80x80
    resized_image = input_image.resize((80, 80), Image.LANCZOS)

    # 閾值
    threshold = 128

    # 將圖像分解為 R, G, B 和 A 通道
    r, g, b, a = resized_image.split()

    # 對 R, G, B 通道進行二值化處理
    r = r.point(lambda x: 255 if x > threshold else 0)
    g = g.point(lambda x: 255 if x > threshold else 0)
    b = b.point(lambda x: 255 if x > threshold else 0)

    # 對 A 通道進行二值化處理，將灰色邊界轉化為黑色
    a = a.point(lambda x: 255 if x > threshold else 0)

    # 重新組合 R, G, B 和 A 通道
    binary_image = Image.merge('RGBA', (r, g, b, a))

    # 創建透明底圖（160x160）
    base_image = Image.new('RGBA', (160, 160), (255, 255, 255, 0))
    # 將縮放後的圖像貼到指定位置（40, 60）
    base_image.paste(binary_image, (40, 60), binary_image)

    # 儲存輸出圖像
    base_image.save(output_image_path)


if __name__ == "__main__":
    input_path = r"8_small_yu.png"
    output_path = "8_small_yu.png"
    process_image(input_path, output_path)