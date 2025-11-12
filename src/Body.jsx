// Body.jsx (Đã sửa để gọi API)
import React, { useState, useEffect } from 'react';
import './ProductList.css';
import { useNavigate } from "react-router";

const ProductList = () => {
    const navigate = useNavigate();
    
    // 1. Dùng state để lưu sản phẩm và trạng thái loading
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Dùng useEffect để gọi API khi component được tải
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/products')
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data = await res.json()
                setProducts(data)
            } catch (err) {
                console.error("Lỗi khi fetch sản phẩm:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, []);

    const handleProductClick = (product) => {
        // Chuyển hướng đến trang shopping
        navigate(`/shopping/${product.id}`, { state: { product } });
    };    

    if (loading) {
        return <div>Đang tải sản phẩm...</div>;
    }

    return (
        <div className="product-list">
            {/* 4. Lấy dữ liệu từ state 'products' thay vì 'sanpham' */}
            {products.map((product) => (
                <div 
                    key={product.id}
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
    );
};

export default ProductList;