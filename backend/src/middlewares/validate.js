const { z } = require('zod');

const transformRequestSchema = z.object({
  transformations: z.object({
    resize: z.object({
      width: z.number().int().positive().max(5000).optional(),
      height: z.number().int().positive().max(5000).optional()
    }).refine(data => data.width || data.height, {
      message: "Resize cần ít nhất chiều rộng (width) hoặc chiều cao (height)"
    }).optional(),
    crop: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      x: z.number().int().min(0),
      y: z.number().int().min(0)
    }).optional(),
    rotate: z.number().min(-360).max(360).optional(),
    format: z.enum(['jpeg', 'jpg', 'png', 'webp', 'avif']).optional(),
    filters: z.object({
      grayscale: z.boolean().optional(),
      sepia: z.boolean().optional()
    }).optional()
  }).refine(obj => Object.keys(obj).length > 0, {
    message: "Phải cung cấp ít nhất 1 thao tác chỉnh sửa trong 'transformations'"
  })
});

function validateTransformInput(req, res, next) {
  const parsed = transformRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Dữ liệu đầu vào không hợp lệ',
      details: parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    });
  }
  req.body = parsed.data;
  next();
}

module.exports = { validateTransformInput };
