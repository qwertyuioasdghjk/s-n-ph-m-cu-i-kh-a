// server/server.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';    // <-- 1. Import mongoose
import dotenv from 'dotenv';        // <-- 2. Import dotenv

dotenv.config(); // <-- 3. Load variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// --- API ROUTES ---
// (Your /api/login, /api/products routes go here)
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!" });
});
// --- API ROUTES ---

// (API /api/login và /api/register của bạn ở đây)

// 2. THÊM API ĐỂ LẤY TẤT CẢ SẢN PHẨM (Cho Body.jsx)
app.get('/api/products/all', async (req, res) => {
  try {
    const allProducts = await Product.find(); // .find() rỗng sẽ lấy tất cả
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy tất cả sản phẩm" });
  }
});

// 3. THÊM API ĐỂ LẤY SẢN PHẨM THEO DANH MỤC (Cho ProductListPage.jsx)
app.get('/api/products/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    if (products.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm theo danh mục" });
  }
});
// --------------------


// --- PRODUCTION STATIC SERVING ---
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}
// ---------------------------------


// --- 4. CONNECT TO MONGODB & START SERVER ---
console.log("Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    
    // Only start listening *after* the connection is successful
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:");
    console.error(err);
    process.exit(1); // Exit the process if we can't connect
  });
  // TRONG server.js (ví dụ)
// import Product from './models/Product.js'; // Bạn sẽ tạo tệp này sau

// API route mà App.jsx của bạn sẽ gọi
app.get('/api/products', async (req, res) => {
  try {
    // 'Product.find()' sẽ lấy TẤT CẢ các tài liệu
    // từ collection 'products' của bạn
    const allProducts = await Product.find(); 
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Bạn cũng có thể lấy sản phẩm theo danh mục
app.get('/api/products/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});