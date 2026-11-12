const fs = require('fs/promises');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Khởi tạo S3 Client nếu người dùng chọn chế độ 's3'
const s3Client = process.env.STORAGE_MODE === 's3' ? new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
}) : null;

async function uploadFile(storageKey, buffer, contentType) {
  if (process.env.STORAGE_MODE === 's3') {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }));
    return `${process.env.S3_PUBLIC_DOMAIN}/${storageKey}`;
  }

  // Chế độ mặc định: Lưu vào thư mục uploads/ trên máy
  const filePath = path.join(UPLOAD_DIR, storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/uploads/${storageKey}`;
}

async function downloadFile(storageKey) {
  if (process.env.STORAGE_MODE === 's3') {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: storageKey,
    }));
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  // Chế độ mặc định: Đọc từ ổ cứng
  const filePath = path.join(UPLOAD_DIR, storageKey);
  return await fs.readFile(filePath);
}

module.exports = { uploadFile, downloadFile };
