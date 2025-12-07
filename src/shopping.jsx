
import React, { useState, useEffect } from 'react';
import "./shopping.css";
import { useParams, useNavigate } from 'react-router-dom';
import sanphamList from './components/FullList/List';

const Shopping = () => {
  const [count, setCount] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState(sanphamList);
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [finalTotal, setFinalTotal] = useState(null)

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

  const parsePrice = (s) => {
    if (!s) return 0
    const n = String(s).replace(/[^0-9]/g, '')
    return Number(n || 0)
  }
  const unitPrice = parsePrice(product.price)
  const subtotal = unitPrice * count

  const applyCoupon = async () => {
    const code = String(couponCode || '').trim().toUpperCase()
    try {
      const res = await fetch('/api/coupons/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, total: subtotal }) })
      if (!res.ok) {
        try {
          const err = await res.json()
          if (err && err.error) alert(err.error)
        } catch {}
        setDiscount(0)
        setFinalTotal(subtotal)
        return
      }
      const data = await res.json()
      setDiscount(data.discount || 0)
      setFinalTotal(data.finalTotal || subtotal)
    } catch {
      setDiscount(0)
      setFinalTotal(subtotal)
    }
  }

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      quantity: count,
      discount,
      finalTotal: finalTotal !== null ? finalTotal : subtotal
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
          <p>Tạm tính: {subtotal.toLocaleString('vi-VN')}₫</p>
          {finalTotal !== null && (
            <p>Thanh toán: {finalTotal.toLocaleString('vi-VN')}₫</p>
          )}
          <div style={{ margin: '8px 0' }}>
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Nhập mã giảm giá" />
            <button onClick={applyCoupon} style={{ marginLeft: 8 }}>Áp dụng</button>
          </div>
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
