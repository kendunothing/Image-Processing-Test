const rateLimit = require('express-rate-limit');

const transformRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Tối đa 20 lần biến đổi ảnh cho mỗi IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Quá nhiều yêu cầu chỉnh sửa ảnh từ IP của bạn, vui lòng thử lại sau 15 phút.'
  }
});

module.exports = { transformRateLimiter };
