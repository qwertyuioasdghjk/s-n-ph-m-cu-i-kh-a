// import React, { useState } from 'react';
// import "./shopping.css";
// import { useParams, useNavigate } from 'react-router-dom';
// import sanpham from './components/FullList/List';

// const Shopping = () => {
//   const [count, setCount] = useState(1);
//   const { id } = useParams();
//   const navigate = useNavigate();

//   // convert id nếu cần
//   const product = sanpham.find(item => String(item.id) === id);

//   const decrease = () => {
//     if (count > 1) setCount(prev => prev - 1);
//   };

//   const increase = () => {
//     setCount(prev => prev + 1);
//   };

//   const handleAddToCart = () => {
//     const cartItem = {
//       ...product,
//       quantity: count,
//     };
//     navigate('/cart', { state: { newItem: cartItem } });
//   };


//   const handleBuyNow = () => {
//     const cartItem = {
//       ...product,
//       quantity: count,
//     };
//     navigate('/checkout', { state: { cartItems: [cartItem] } });
//   };
//   if (!product) {
//     return <div>Không tìm thấy sản phẩm</div>;
//   }

//   return (
//     <div className="back-button">
//       <h1>{product.name}</h1>
//       <div className="product-detail">
//         <img src={product.Image} alt={product.name} className="product-image-detail" />
//         <div className="product-name-detail">
//           <h2>Giá Bán:</h2>
//           <h3>{product.price}</h3>
//           <p>(Mã sản phẩm có chữ cuối V là hàng CTY giá đã bao gồm thuế)</p>

//           <h2>Số lượng:</h2>
//           <div className="quantity-wrapper-card">
//             <div className="quantity-container">
//               <button onClick={decrease}>-</button>
//               <p>{count}</p>
//               <button onClick={increase}>+</button>
//             </div>
//           </div>
//           <div className="action-buttons">
//             <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
//             <button onClick={handleBuyNow}>Mua ngay</button>
//           </div>
//         </div>
//       </div>
//       <div className="product-description-detail">
//         <h2>Mô tả sản phẩm</h2>
//         <p>{product.description}</p>
//       </div>
//     </div>
//   );
// };

// export default Shopping;



import React, { useState, useEffect } from 'react';
import "./shopping.css";
import { useParams, useNavigate } from 'react-router-dom';
import sanphamList from './components/FullList/List';

const Shopping = () => {
  const [count, setCount] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState(sanphamList);

  useEffect(() => {
    const storedProducts = localStorage.getItem('sanpham');
    if (storedProducts) setProducts(JSON.parse(storedProducts));
  }, []);

  const product = products.find(item => String(item.id) === id);

  const decrease = () => {
    if (count > 1) setCount(prev => prev - 1);
  };

  const increase = () => {
    setCount(prev => prev + 1);
  };

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      quantity: count,
    };
    navigate('/cart', { state: { newItem: cartItem } });
  };

  const handleBuyNow = () => {
    const cartItem = {
      ...product,
      quantity: count,
    };
    navigate('/checkout', { state: { cartItems: [cartItem] } });
  };

  if (!product) {
    return <div>Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className="back-button">
      <h1>{product.name}</h1>
      <div className="product-detail">
        <img src={product.Image} alt={product.name} className="product-image-detail" />
        <div className="product-name-detail">
          <h2>Giá Bán:</h2>
          <h3>{product.price}</h3>
          <p>(Mã sản phẩm có chữ cuối V là hàng CTY giá đã bao gồm thuế)</p>

          <h2>Số lượng:</h2>
          <div className="quantity-wrapper-card">
            <div className="quantity-container">
              <button onClick={decrease}>-</button>
              <p>{count}</p>
              <button onClick={increase}>+</button>
            </div>
          </div>
          <div className="action-buttons">
            <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
            <button onClick={handleBuyNow}>Mua ngay</button>
          </div>
        </div>
      </div>
      <div className="product-description-detail">
        <h2>Mô tả sản phẩm</h2>
        <p>{product.description}</p>
      </div>
    </div>
  );
};

export default Shopping;
