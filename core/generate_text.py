import os
import cv2
import numpy as np
from core.text_dict import filename_dict


class GenerateText:
    def __init__(self):
        self.filename_dict = filename_dict

    def overlay_image(self, base_img, overlay_img, direction):
        if direction == 'horizontal':
            x_offset = 130
            y_offset = 91
        else:  # direction == 'vertical'
            x_offset = 0
            y_offset = 91

        alpha_overlay = overlay_img[:, :, 3]
        alpha_base = base_img[y_offset:y_offset + overlay_img.shape[0], x_offset:x_offset + overlay_img.shape[1], 3]
        alpha_mask = np.where(alpha_overlay == 0, alpha_base, alpha_overlay)

        base_img[y_offset:y_offset + overlay_img.shape[0], x_offset:x_offset + overlay_img.shape[1], :3] = \
            np.where(alpha_overlay[:, :, None] == 0,
                     base_img[y_offset:y_offset + overlay_img.shape[0], x_offset:x_offset + overlay_img.shape[1], :3],
                     overlay_img[:, :, :3])

        base_img[y_offset:y_offset + overlay_img.shape[0], x_offset:x_offset + overlay_img.shape[1], 3] = alpha_mask

        return base_img

    def concatenate_images(self, texts, direction='horizontal', folder_path="text_img", padding=0):
        if direction not in ['horizontal', 'vertical']:
            raise ValueError("Invalid direction. Expected 'horizontal' or 'vertical'.")

        if padding < 0:
            raise ValueError("Invalid padding value. Must be a non-negative integer.")

        images = []
        for text in texts:
            filenames = self.filename_dict[text]
            if not isinstance(filenames, tuple):
                filenames = (filenames,)

            base_img_path = os.path.join(folder_path, filenames[0])
            base_img = cv2.imread(base_img_path, cv2.IMREAD_UNCHANGED)

            if base_img is None:
                raise ValueError(f"Failed to read the image: {base_img_path}")

            if len(filenames) > 1:
                for filename in filenames[1:]:
                    overlay_img_path = os.path.join(folder_path, filename)
                    overlay_img = cv2.imread(overlay_img_path, cv2.IMREAD_UNCHANGED)

                    if overlay_img is None:
                        raise ValueError(f"Failed to read the image: {overlay_img_path}")

                    base_img = self.overlay_image(base_img, overlay_img, direction)
            else:
                # Apply padding 濁音半濁音不做內縮處理
                if padding:  # padding=0 時不執行，避免錯誤
                    if direction == 'horizontal':
                        base_img = base_img[:, padding:-padding, :]
                    else:  # direction == 'vertical'
                        base_img = base_img[padding:-padding, :, :]

            images.append(base_img)

        if direction == 'horizontal':
            result = np.concatenate(images, axis=1)
        else:  # direction == 'vertical'
            result = np.concatenate(images, axis=0)

        return result


if __name__ == '__main__':
    from PIL import Image
    # 使用範例
    texts = ['ba', 'ga', '-', 'he', 'n', 'ta', 'i']
    direction = 'horizontal'  # 或 'vertical'
    result_image = GenerateText().concatenate_images(texts, direction, folder_path="../text_img", padding=25)

    # 將 OpenCV 圖片轉換為 PIL 圖片
    result_image_pil = Image.fromarray(cv2.cvtColor(result_image, cv2.COLOR_BGRA2RGBA))
    # 顯示具有透明度的圖片
    result_image_pil.show()
