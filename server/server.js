

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';    
import dotenv from 'dotenv';        

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());


app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!" });
});

app.get('/api/products/all', async (req, res) => {
  try {
    const allProducts = await Product.find(); 
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy tất cả sản phẩm" });
  }
});


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
})




if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}



console.log("Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    
  
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:");
    console.error(err);
    process.exit(1);
  });
  
app.get('/api/products', async (req, res) => {
  try {
  
    const allProducts = await Product.find(); 
    res.json(allProducts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});


app.get('/api/products/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});