import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductList.css';

const ProductListPage = () => {
  const navigate = useNavigate();
  const { category } = useParams(); 
  
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {

    setLoading(true);

    
    fetch(`/api/products/${category}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setProducts(data); 
        setLoading(false); 
      })
      .catch(error => {
        console.error('Lỗi khi fetch sản phẩm:', error);
        setLoading(false); 
      });
  }, [category]); 

  const handleProductClick = (product) => {
    
    navigate(`/shopping/${product._id}`, { state: { product } });
  };


  if (loading) {
    return <div>Đang tải sản phẩm...</div>;
  }

  
  if (products.length === 0) {
    return <div>Không tìm thấy sản phẩm nào cho danh mục này.</div>;
  }

  
  return (
    <div>
      <div className='product-app'>
        <h2>Sản phẩm trong danh mục: {category}</h2>
      </div>
      <div className="product-list">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="product-card" 
            onClick={() => handleProductClick(product)}
          >
            <img 
              src={product.Image} 
              alt={product.name} 
              className="product-image" 
            />
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">{product.price}</p>
            <p className="product-description">{product.description}</p>
          </div>
        ))}
      </div>
    </div> 
  );
};

export default ProductListPage;