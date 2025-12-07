import React, { useState, useEffect } from 'react';
import EditProduct from './EditProduct';
import useUser from '@/hooks/useUser';
import './Admin.css'
const AdminProductManager = () => {
  const { user } = useUser();
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    Image: ''
  });
  const authFetch = async (url, options = {}) => {
    const t = localStorage.getItem('accessToken') || ''
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` } })
    if (res.status === 401 || res.status === 403) {
      const rt = localStorage.getItem('refreshToken') || ''
      if (rt) {
        const r = await fetch('/api/v1/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
        if (r.ok) {
          const data = await r.json()
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken)
            return fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${data.accessToken}` } })
          }
        }
      }
    }
    return res
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products')
        if (!res.ok) return
        const data = await res.json()
        setProducts(data)
      } catch {}
    }
    load()
  }, []);

  if (!user || user.role !== 'admin') {
    return <p>⛔ Bạn không có quyền truy cập trang này.</p>;
  }

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setNewProduct({ name: '', price: '', description: '', Image: '' });
  };

  const handleSave = async (updatedProduct) => {
    if (editingId) {
      try {
        const targetId = editingId || updatedProduct.id || updatedProduct._id
        const res = await authFetch(`/api/products/${targetId}` ,{
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        })
        if (!res.ok) return
        const saved = await res.json()
        setProducts(products.map(p => ((p.id === saved.id) || (p._id === saved._id)) ? saved : p))
        setEditingId(null)
      } catch {}
    } else if (addingNew) {
      try {
        const payload = { ...updatedProduct, id: Date.now().toString() }
        const res = await authFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) return
        const created = await res.json()
        setProducts([...products, created])
        setAddingNew(false)
        setNewProduct({ name: '', price: '', description: '', Image: '' })
      } catch {}
    }
  };

  const handleAddClick = () => {
    setAddingNew(true);
    setEditingId(null);
  };

  return (
        <div className="admin-manager">
  <h2>🛠️ Quản lý Sản phẩm (Admin)</h2>

  <button onClick={handleAddClick} className="add-product-btn">
    ➕ Thêm sản phẩm mới
  </button>

  {addingNew && (
    <EditProduct
      product={newProduct}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )}

  {products.map(product => (
    <div key={product.id || product._id} className="product-card">
      {editingId === (product.id || product._id) ? (
        <EditProduct
          product={product}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <p><strong>Tên:</strong> {product.name}</p>
          <p><strong>Giá:</strong> {product.price}</p>
          <p><strong>Mô tả:</strong> {product.description}</p>
          <img src={product.Image} alt={product.name} />
          <div className="admin-buttons">
            <button onClick={() => handleEdit(product.id || product._id)}>✏️ Chỉnh sửa</button>
          </div>
        </>
      )}
    </div>
  ))}
</div>
  )
};

export default AdminProductManager;
