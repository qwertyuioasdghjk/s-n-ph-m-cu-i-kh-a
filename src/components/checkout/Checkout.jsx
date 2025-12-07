import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Checkout.css';

const cleanPrice = (priceString) => {
  return parseFloat(priceString.replace(/[^\d]/g, '')) || 0;
};

const formatPrice = (num) => {
  // chuyển số thành dạng có dấu phẩy phân cách hàng nghìn và thêm ₫
  return num.toLocaleString('vi-VN') + '₫';
};

const CheckoutPage = () => {
  const location = useLocation();
  const cartItemsFromState = location.state?.cartItems || [];

  // đảm bảo mỗi item có numericPrice, nếu chưa có
  const cartItems = cartItemsFromState.map(item => {
    const numericPrice = item.numericPrice !== undefined
      ? item.numericPrice
      : cleanPrice(item.price || '');
    return { ...item, numericPrice };
  });

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  // tính subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.numericPrice * (item.quantity || 1);
  }, 0);

  const finalTotal = subtotal - discount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    const code = String(coupon || '').trim().toUpperCase()
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, total: subtotal })
      })
      if (!res.ok) {
        try {
          const err = await res.json()
          alert(err?.error || 'Mã giảm giá không hợp lệ!')
        } catch {
          alert('Mã giảm giá không hợp lệ!')
        }
        setDiscount(0)
        return
      }
      const data = await res.json()
      setDiscount(data.discount || 0)
    } catch {
      alert('Không thể áp dụng mã giảm giá. Vui lòng thử lại.')
      setDiscount(0)
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // xử lý gửi form ...
    alert('Thông tin thanh toán đã được gửi!');
  };

  return (
    <div className="checkout-container">
      <h2>Thông tin thanh toán</h2>
      <div className="checkout-content">
        <form className="billing-form" onSubmit={handleSubmit}>
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            type="text"
            placeholder="Họ và tên"
            required
          />
          <input
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            type="text"
            placeholder="Tên công ty (không bắt buộc)"
          />
          <input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            type="text"
            placeholder="Địa chỉ"
            required
          />
          <input
            name="apartment"
            value={formData.apartment}
            onChange={handleInputChange}
            type="text"
            placeholder="Căn hộ, tầng, v.v. (không bắt buộc)"
          />
          <input
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            type="text"
            placeholder="Thành phố / Quận"
            required
          />
          <input
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            type="text"
            placeholder="Tỉnh / Bang"
            required
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            type="tel"
            placeholder="Số điện thoại"
            required
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            type="email"
            placeholder="Địa chỉ email"
            required
          />
          <label>
            <input type="checkbox" />
            Lưu thông tin cho lần thanh toán sau
          </label>

          <div className="sidebar">
            <div className="order-summary">
              <h3>Đơn hàng</h3>
              {cartItems.length === 0 ? (
                <p>Không có sản phẩm trong giỏ hàng.</p>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="checkout-item">
                    {item.Image && (
                      <img src={item.Image} alt={item.name} className="checkout-item-img" />
                    )}
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{item.name}</p>
                      <p>
                        Đơn giá: {formatPrice(item.numericPrice)} × {item.quantity} ={' '}
                        <strong>{formatPrice(item.numericPrice * item.quantity)}</strong>
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div className="checkout-summary-totals">
                <p>Subtotal: {formatPrice(subtotal)}</p>
                {discount > 0 && <p>Giảm giá: -{formatPrice(discount)}</p>}
                <h4>Tổng cộng: {formatPrice(finalTotal)}</h4>
              </div>
              <div className="coupon-section">
                <input
                  type="text"
                  placeholder="Mã giảm giá"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <button type="button" className="apply-btn" onClick={handleApplyCoupon}>
                  Áp dụng mã
                </button>
              </div>
              <button type="submit" className="checkout-btn">
                Đặt hàng
              </button>
            </div>

            <div className="payment-options">
              <h3>Phương thức thanh toán</h3>
              <label>
                <input type="radio" name="payment" value="bank-transfer" />
                Chuyển khoản ngân hàng
              </label>
              <label>
                <input type="radio" name="payment" value="cod" />
                Thanh toán khi nhận hàng
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
