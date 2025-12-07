// Body.jsx (Đã sửa để gọi API)
import React, { useState, useEffect } from 'react';
import './ProductList.css';
import { useNavigate } from "react-router";

const ProductList = () => {
    const navigate = useNavigate();
    
   
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannerIndex, setBannerIndex] = useState(0);

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
        const pid = product.id || product._id
        navigate(`/shopping/${pid}`, { state: { product } });
    }    

    useEffect(() => {
        if (!products || products.length === 0) return
        const max = Math.min(5, products.length)
        const t = setInterval(() => {
            setBannerIndex((i) => (i + 1) % max)
        }, 4000)
        return () => clearInterval(t)
    }, [products])

    const bannerItems = products.slice(0, 5)
    const current = bannerItems[bannerIndex]
    const prev = () => setBannerIndex((i) => (i - 1 + bannerItems.length) % bannerItems.length)
    const next = () => setBannerIndex((i) => (i + 1) % bannerItems.length)

    if (loading) {
        return <div>Đang tải sản phẩm...</div>;
    }

    return (
        <>
            {bannerItems.length > 0 && (
                <div className="banner">
                    <div className="banner-inner" onClick={() => handleProductClick(current)}>
                        <img className="banner-image" src={current.Image} alt={current.name} />
                        <div className="banner-info">
                            <h2>{current.name}</h2>
                            <p>{current.price}</p>
                            <button className="banner-cta">Xem chi tiết</button>
                        </div>
                    </div>
                    <div className="banner-controls">
                        <button className="banner-prev" onClick={prev}>‹</button>
                        <button className="banner-next" onClick={next}>›</button>
                    </div>
                    <div className="banner-dots">
                        {bannerItems.map((_, idx) => (
                            <span key={idx} className={idx === bannerIndex ? 'dot active' : 'dot'} onClick={() => setBannerIndex(idx)} />
                        ))}
                    </div>
                </div>
            )}
            <div className="product-list">
           
            {products.map((product) => (
                <div 
                    key={product.id || product._id}
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
        </>
    );
};

export default ProductList;
