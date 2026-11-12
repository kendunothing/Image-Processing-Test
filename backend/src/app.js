require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const swaggerUi = require('swagger-ui-express');

const ImageModel = require('./models/Image');
const { processImageTransformations } = require('./services/imageProcessor');
const { uploadFile, downloadFile } = require('./services/storage');
const { transformRateLimiter } = require('./middlewares/rateLimiter');
const { validateTransformInput } = require('./middlewares/validate');
const swaggerDocument = require('./config/swagger');

const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json());

// Phục vụ file tĩnh nếu chạy ở chế độ lưu ổ cứng (Local)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Trang tài liệu Swagger UI để test trực tiếp trên trình duyệt
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/api-docs'));

// Cấu hình Multer nhận file ảnh trên RAM (giới hạn 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ cho phép tải lên file hình ảnh!'));
    }
    cb(null, true);
  }
});

// ==========================================
// ENDPOINT BỔ SUNG: POST /images (Upload ảnh gốc)
// ==========================================
app.post('/images', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng đính kèm file ảnh (field: image)' });

    const metadata = await sharp(req.file.buffer).metadata();
    const ext = metadata.format || 'jpg';
    const storageKey = `originals/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

    const publicUrl = await uploadFile(storageKey, req.file.buffer, req.file.mimetype);

    const newImage = await ImageModel.create({
      url: publicUrl,
      storageKey,
      format: ext,
      width: metadata.width,
      height: metadata.height,
      size: req.file.size,
      isTransformed: false
    });

    res.status(201).json(newImage);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 1. POST /images/:id/transform (Biến đổi ảnh + Caching)
// ==========================================
app.post('/images/:id/transform', transformRateLimiter, validateTransformInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transformations } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID bức ảnh không đúng định dạng' });
    }

    // Tạo khóa Cache duy nhất từ ID ảnh gốc và nội dung biến đổi
    const payloadHash = crypto.createHash('md5').update(id + JSON.stringify(transformations)).digest('hex');
    const targetFormat = (transformations.format === 'jpg' ? 'jpeg' : transformations.format) || 'webp';
    const transformedStorageKey = `transformed/${id}_${payloadHash}.${targetFormat}`;

    // Kiểm tra Cache: Nếu ảnh đã từng biến đổi y hệt trước đây, trả về luôn
    const cachedImage = await ImageModel.findOne({ storageKey: transformedStorageKey });
    if (cachedImage) {
      return res.status(200).json({ cached: true, data: cachedImage });
    }

    // Tìm ảnh gốc
    const originalImage = await ImageModel.findById(id);
    if (!originalImage) return res.status(404).json({ error: 'Không tìm thấy bức ảnh gốc' });

    // Tải ảnh gốc -> Chỉnh sửa qua Sharp -> Upload ảnh mới
    const inputBuffer = await downloadFile(originalImage.storageKey);
    const { outputBuffer, metadata } = await processImageTransformations(inputBuffer, transformations);
    const publicUrl = await uploadFile(transformedStorageKey, outputBuffer, `image/${metadata.format}`);

    // Lưu vào Database
    const transformedDoc = await ImageModel.create({
      originalId: originalImage._id,
      url: publicUrl,
      storageKey: transformedStorageKey,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
      isTransformed: true
    });

    res.status(200).json({ cached: false, data: transformedDoc });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. GET /images/:id (Lấy chi tiết 1 bức ảnh)
// ==========================================
app.get('/images/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID bức ảnh không hợp lệ' });
    }
    const image = await ImageModel.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Không tìm thấy bức ảnh' });
    res.json(image);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. GET /images?page=1&limit=10 (Danh sách phân trang)
// ==========================================
app.get('/images', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ImageModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ImageModel.countDocuments()
    ]);

    res.json({
      data: items,
      pagination: {
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// GLOBAL ERROR HANDLER (Xử lý lỗi tập trung)
// ==========================================
app.use((err, req, res, next) => {
  console.error('[Error]:', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Lỗi hệ thống máy chủ nội bộ (Internal Server Error)'
  });
});

// Kết nối Database và khởi động Server
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image_service';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB thành công');
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📄 Tài liệu Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });
