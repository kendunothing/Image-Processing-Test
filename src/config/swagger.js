const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Scalable Image Processing Service API',
    version: '1.0.0',
    description: 'Hệ thống Backend tải lên, lưu trữ đám mây và biến đổi ảnh (Resize, Crop, Rotate, Filters, Caching).'
  },
  paths: {
    '/images': {
      post: {
        summary: '1. Upload một bức ảnh gốc lên hệ thống',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { image: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: { 201: { description: 'Upload thành công' } }
      },
      get: {
        summary: '2. Lấy danh sách ảnh (có phân trang)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: { 200: { description: 'Danh sách ảnh phân trang' } }
      }
    },
    '/images/{id}': {
      get: {
        summary: '3. Xem thông tin chi tiết 1 bức ảnh',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Chi tiết bức ảnh' }, 404: { description: 'Không tìm thấy' } }
      }
    },
    '/images/{id}/transform': {
      post: {
        summary: '4. Biến đổi ảnh (Resize, Crop, Rotate, Format, Filters)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: {
                  transformations: {
                    resize: { width: 800, height: 600 },
                    rotate: 90,
                    format: 'webp',
                    filters: { grayscale: true, sepia: false }
                  }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Trả về ảnh đã biến đổi (từ Cache hoặc xử lý mới)' } }
      }
    }
  }
};

module.exports = swaggerDocument;
