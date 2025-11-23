import mongoose from 'mongoose';


const productSchema = new mongoose.Schema({
  id: { type: String, required: true }, 
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String },
  description: { type: String },
  Image: { type: String } 
}, {
  
  collection: 'products' 
});
const Product = mongoose.model('Product', productSchema);

export default Product;