import { useState } from 'react';

const BACKEND_URL = 'http://localhost:3000'; // Đảm bảo Backend của bạn đang chạy ở port này

function App() {
  const [file, setFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [transformedImage, setTransformedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State cho form chỉnh sửa
  const [formData, setFormData] = useState({
    width: '', height: '', rotate: '', format: 'webp', grayscale: false
  });

  // Xử lý upload ảnh gốc
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Vui lòng chọn 1 file ảnh');
    
    setLoading(true); setError(''); setTransformedImage(null);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await fetch(`${BACKEND_URL}/images`, { method: 'POST', body: data });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Lỗi upload');
      setOriginalImage(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi yêu cầu biến đổi ảnh
  const handleTransform = async (e) => {
    e.preventDefault();
    if (!originalImage) return setError('Vui lòng upload ảnh trước');

    setLoading(true); setError('');
    
    // Đóng gói dữ liệu chuẩn bị gửi (lọc bỏ các trường trống)
    const transformations = {};
    if (formData.width || formData.height) {
      transformations.resize = {};
      if (formData.width) transformations.resize.width = parseInt(formData.width);
      if (formData.height) transformations.resize.height = parseInt(formData.height);
    }
    if (formData.rotate) transformations.rotate = parseInt(formData.rotate);
    if (formData.format) transformations.format = formData.format;
    if (formData.grayscale) transformations.filters = { grayscale: true };

    try {
      const res = await fetch(`${BACKEND_URL}/images/${originalImage._id}/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transformations })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Lỗi biến đổi ảnh');
      setTransformedImage(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          🖼️ Tiệm Sửa Ảnh Đám Mây
        </h1>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CỘT TRÁI: Upload & Hiển thị ảnh gốc */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">1. Ảnh Gốc</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                {loading ? 'Đang tải lên...' : 'Tải ảnh lên'}
              </button>
            </form>

            {originalImage && (
              <div className="mt-6">
                <img src={originalImage.url} alt="Original" className="w-full h-auto rounded-lg border" />
                <p className="text-sm text-gray-500 mt-2">Định dạng: {originalImage.format} | Kích thước: {originalImage.width}x{originalImage.height}</p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Bảng điều khiển & Kết quả */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">2. Bảng Điều Khiển</h2>
            <form onSubmit={handleTransform} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chiều rộng (px)</label>
                  <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} placeholder="Vd: 800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chiều cao (px)</label>
                  <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="Vd: 600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Xoay (độ)</label>
                  <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.rotate} onChange={e => setFormData({...formData, rotate: e.target.value})} placeholder="Vd: 90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Định dạng xuất</label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})}>
                    <option value="webp">WebP (Khuyên dùng)</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="avif">AVIF</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="grayscale" className="h-4 w-4 text-blue-600 rounded border-gray-300" checked={formData.grayscale} onChange={e => setFormData({...formData, grayscale: e.target.checked})} />
                <label htmlFor="grayscale" className="ml-2 block text-sm text-gray-900">Áp dụng bộ lọc Trắng Đen</label>
              </div>

              <button type="submit" disabled={!originalImage || loading} className={`w-full py-2 rounded-lg text-white font-bold transition ${(!originalImage || loading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                {loading ? 'Đang xử lý...' : 'Biến đổi ảnh'}
              </button>
            </form>

            {transformedImage && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-2">✅ Ảnh đã xử lý:</h3>
                <img src={transformedImage.url} alt="Transformed" className="w-full h-auto rounded-lg shadow-sm" />
                <div className="mt-3 text-sm text-green-700 space-y-1">
                  <p>Mới: {transformedImage.format.toUpperCase()} | {transformedImage.width}x{transformedImage.height}px</p>
                  <a href={transformedImage.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Tải ảnh xuống</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
