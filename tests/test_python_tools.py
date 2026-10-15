import contextlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image, ImageDraw

from core.crop_text import crop_text
from core import generate_text
from core.text_dict import filename_dict
from scripts import generate_glyph_vectors as vectors


class GlyphGeneratorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "sources"
        self.source.mkdir()
        self.output = self.root / "glyphVectors.ts"
        self.original = "existing valid glyph vectors\n"
        self.output.write_text(self.original, encoding="utf-8")

    def test_empty_sources_preserve_existing_output(self):
        with self.assertRaisesRegex(ValueError, "No PNG source"):
            vectors.main(self.source, self.output)
        self.assertEqual(self.output.read_text(encoding="utf-8"), self.original)

    def test_missing_sources_preserve_existing_output(self):
        Image.new("RGBA", (8, 8), "black").save(self.source / "1_a.png")
        with self.assertRaisesRegex(ValueError, "Missing glyph source"):
            vectors.main(self.source, self.output)
        self.assertEqual(self.output.read_text(encoding="utf-8"), self.original)

    def test_complete_sources_generate_all_required_glyphs(self):
        required = {
            name
            for names in filename_dict.values()
            for name in (names if isinstance(names, tuple) else (names,))
        }
        for name in required:
            Image.new("RGBA", (8, 8), "black").save(self.source / name)
        vectors.main(self.source, self.output)
        result = self.output.read_text(encoding="utf-8")
        for name in required:
            self.assertIn(f'"{name}":', result)
        self.assertNotIn('"path": ""', result)

        Image.new("RGBA", (8, 8), (0, 0, 0, 0)).save(self.source / "1_a.png")
        with self.assertRaisesRegex(ValueError, "no visible shape"):
            vectors.main(self.source, self.output)
        self.assertEqual(self.output.read_text(encoding="utf-8"), result)


class CropTests(unittest.TestCase):
    def test_non_square_glyphs_keep_dimensions_and_all_opaque_pixels(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for width, height in ((40, 10), (10, 40)):
                with self.subTest(width=width, height=height):
                    source = root / "input.png"
                    image = Image.new("RGB", (60, 60), "white")
                    ImageDraw.Draw(image).rectangle(
                        (10, 10, 10 + width - 1, 10 + height - 1), fill="black"
                    )
                    image.save(source)
                    crop_text(source, dilate_iter=0, output_dir=root / "cropped")
                    with Image.open(root / "cropped" / "0.png") as result:
                        self.assertEqual(result.size, (int(width * 1.2), int(height * 1.2)))
                        self.assertEqual(np.count_nonzero(np.array(result)[:, :, 3]), width * height)

    def test_undersized_fixed_canvas_rejected_before_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "input.png"
            image = Image.new("RGB", (60, 40), "white")
            ImageDraw.Draw(image).rectangle((10, 10, 49, 19), fill="black")
            image.save(source)
            with self.assertRaisesRegex(ValueError, "avoid clipping"):
                crop_text(source, limit_length=20, dilate_iter=0, output_dir=root / "cropped")
            self.assertFalse((root / "cropped").exists())


class GenerateTextTests(unittest.TestCase):
    def test_default_asset_path_is_independent_of_working_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "text_img").mkdir()
            (root / "elsewhere").mkdir()
            Image.new("RGBA", (160, 160), "black").save(root / "text_img" / "1_a.png")
            with patch.object(generate_text, "ROOT", root), contextlib.chdir(root / "elsewhere"):
                result = generate_text.GenerateText().concatenate_images(["a"], padding=25)
            self.assertEqual(result.shape, (160, 110, 4))

    def test_empty_tokens_and_excessive_padding_have_clear_errors(self):
        with self.assertRaisesRegex(ValueError, "At least one"):
            generate_text.GenerateText().concatenate_images([])
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            Image.new("RGBA", (160, 160), "black").save(root / "1_a.png")
            for direction in ("horizontal", "vertical"):
                with self.subTest(direction=direction), self.assertRaisesRegex(ValueError, "entire glyph"):
                    generate_text.GenerateText().concatenate_images(
                        ["a"], direction=direction, folder_path=root, padding=80
                    )


if __name__ == "__main__":
    unittest.main()
