from dataclasses import dataclass
from io import BytesIO

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGE_EDGE = 8192
MAX_IMAGE_PIXELS = 32_000_000
ALLOWED_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


class ImageValidationError(ValueError):
    pass


@dataclass(frozen=True)
class SafeImage:
    data: bytes
    mime_type: str
    source_mime_type: str
    source_size_bytes: int
    width_px: int
    height_px: int


async def validate_and_normalize_image(upload: UploadFile) -> SafeImage:
    data = await upload.read(MAX_IMAGE_BYTES + 1)
    if len(data) == 0 or len(data) > MAX_IMAGE_BYTES:
        raise ImageValidationError("Görsel boş veya 8 MB sınırını aşıyor.")
    try:
        Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
        with Image.open(BytesIO(data)) as probe:
            image_format = probe.format
            width, height = probe.size
            probe.verify()
        if image_format not in ALLOWED_FORMATS:
            raise ImageValidationError("Yalnız JPEG, PNG ve WebP görseller kabul edilir.")
        if width < 1 or height < 1 or width > MAX_IMAGE_EDGE or height > MAX_IMAGE_EDGE:
            raise ImageValidationError("Görsel kenarı 1–8.192 piksel arasında olmalıdır.")
        if width * height > MAX_IMAGE_PIXELS:
            raise ImageValidationError("Görsel 32 megapiksel sınırını aşıyor.")
        with Image.open(BytesIO(data)) as opened:
            normalized = ImageOps.exif_transpose(opened).convert("RGB")
            normalized.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
            output = BytesIO()
            normalized.save(output, format="JPEG", quality=88, optimize=True)
            return SafeImage(
                output.getvalue(),
                "image/jpeg",
                ALLOWED_FORMATS[image_format],
                len(data),
                width,
                height,
            )
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ImageValidationError("Görsel imzası veya kodlaması geçersiz.") from exc
