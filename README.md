# 🖼️ Scalable Image Processing Service

A high-performance RESTful API built with **Node.js, Express, Sharp, and MongoDB** for uploading, transforming, and caching images on the fly. Supports seamless switching between **Local Disk Storage** and **Cloudflare R2 / AWS S3**.

## ✨ Key Features
- **Dynamic Image Transformations:** Resize, crop, rotate, format conversion (`webp`, `avif`, `png`, `jpeg`), and color filters (`grayscale`, `sepia`) powered by `libvips` (`sharp`).
- **Smart Content-Addressable Caching:** Hashes transformation payloads with MD5 to prevent redundant CPU processing for identical requests.
- **Hybrid Cloud Storage:** Built with `@aws-sdk/client-s3` for Cloudflare R2 / AWS S3, with automatic fallback to local storage for rapid development.
- **Security & Reliability:** Input schema validation via `Zod` and IP-based abuse protection using `express-rate-limit`.
- **Interactive API Documentation:** Built-in Swagger UI at `/api-docs`.

## 🏗️ Architecture Flow
`Client Request` ➔ `Rate Limiter` ➔ `Zod Validation` ➔ `MD5 Cache Check (MongoDB)` ➔ *(Cache Miss)* ➔ `Download Original (R2/Local)` ➔ `Sharp Pipeline` ➔ `Upload Transformed` ➔ `Save Metadata & Respond`

## 🚀 Quick Start

1. **Clone & Install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd image-processing-service
   npm install
