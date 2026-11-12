const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', default: null },
  url: { type: String, required: true },
  storageKey: { type: String, required: true, unique: true, index: true },
  format: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  size: { type: Number, required: true }, // Dung lượng tính bằng bytes
  isTransformed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Image', ImageSchema);
