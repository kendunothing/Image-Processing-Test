const sharp = require('sharp');

async function processImageTransformations(inputBuffer, transformations) {
  let pipeline = sharp(inputBuffer);
  const metadataOriginal = await pipeline.metadata();

  // 1. Cắt ảnh (Crop) - Kiểm tra kỹ tọa độ để không vượt quá kích thước ảnh gốc
  if (transformations.crop) {
    const { width, height, x, y } = transformations.crop;
    if (x + width > metadataOriginal.width || y + height > metadataOriginal.height) {
      const err = new Error('Vùng cắt (crop) vượt quá kích thước thực tế của bức ảnh gốc.');
      err.statusCode = 400;
      throw err;
    }
    pipeline = pipeline.extract({ width, height, left: x, top: y });
  }

  // 2. Thay đổi kích thước (Resize)
  if (transformations.resize) {
    const { width, height } = transformations.resize;
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true // Không phóng to làm vỡ ảnh nếu ảnh gốc nhỏ hơn
    });
  }

  // 3. Xoay ảnh (Rotate)
  if (transformations.rotate !== undefined) {
    pipeline = pipeline.rotate(transformations.rotate);
  }

  // 4. Bộ lọc màu (Filters)
  if (transformations.filters) {
    if (transformations.filters.grayscale) {
      pipeline = pipeline.grayscale();
    }
    if (transformations.filters.sepia) {
      pipeline = pipeline.recomb([
        [0.3588, 0.7044, 0.1368],
        [0.2990, 0.5870, 0.1140],
        [0.2392, 0.4696, 0.0912],
      ]);
    }
  }

  // 5. Đổi định dạng (Format)
  const targetFormat = transformations.format || metadataOriginal.format || 'webp';
  pipeline = pipeline.toFormat(targetFormat, { quality: 85 });

  // Xuất kết quả
  const { data: outputBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { outputBuffer, metadata: info };
}

module.exports = { processImageTransformations };
