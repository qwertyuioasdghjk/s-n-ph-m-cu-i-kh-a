import mongoose from 'mongoose';

// Định nghĩa cấu trúc (schema) cho sản phẩm
const productSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Giữ lại id cũ của bạn từ List.jsx
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String },
  description: { type: String },
  Image: { type: String } // Tên trường phải khớp với MongoDB
}, {
  // 'products' là tên collection bạn đã tạo trong MongoDB Compass
  collection: 'products' 
});

// Tạo và export model
const Product = mongoose.model('Product', productSchema);

export default Product;