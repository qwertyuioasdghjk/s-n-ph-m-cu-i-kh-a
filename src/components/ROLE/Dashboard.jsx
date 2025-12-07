import React, { useEffect, useState} from 'react';
import { useNavigate,Link } from 'react-router-dom';
import useUser from '@/hooks/useUser';
import EditProduct from './EditProduct';
import AdminProductManager from './AdminProductManager';
import './Dashboard.css';
import { safeGetItem, safeSetItem } from '../../utils/storage';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logoutUser, isAuthenticated, loading } = useUser();
  const [showAdminProductManager, setShowAdminProductManager] = useState(false);
  const [showttcn,setshowttcn] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [showCouponManager, setShowCouponManager] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percent', value: 0, minTotal: 0, expiresAt: '', active: true, usageLimit: '' });

  
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const authFetch = async (url, options = {}) => {
    const t = safeGetItem('accessToken') || ''
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` } })
    if (res.status === 401 || res.status === 403) {
      const rt = safeGetItem('refreshToken') || ''
      if (rt) {
        const r = await fetch('/api/v1/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
        if (r.ok) {
          const data = await r.json()
          if (data.accessToken) {
            safeSetItem('accessToken', data.accessToken)
            return fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${data.accessToken}` } })
          }
        }
      }
    }
    return res
  }

  const loadUsers = async () => {
    try {
      const res = await authFetch('/api/v1/users')
      if (!res.ok) return
      const data = await res.json()
      setUsersList(data.users || [])
    } catch {}
  }

  const handleToggleUserManager = async () => {
    const next = !showUserManager;
    setShowUserManager(next);
    if (next) await loadUsers();
  };

  const deleteUser = async (id) => {
    try {
      const res = await authFetch(`/api/v1/users/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      await loadUsers()
    } catch {}
  }

  const toggleActive = async (u) => {
    try {
      const res = await authFetch(`/api/v1/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !u.active }) })
      if (!res.ok) return
      await loadUsers()
    } catch {}
  }
  const seedProducts = async () => {
    try {
      setSeeding(true)
      const res = await authFetch('/api/products/seed', { method: 'POST' })
      if (!res.ok) return
      setSeeding(false)
    } catch {
      setSeeding(false)
    }
  }

  const loadCoupons = async () => {
    try {
      const res = await authFetch('/api/coupons/active')
      if (!res.ok) return
      const data = await res.json()
      setCoupons(Array.isArray(data) ? data : [])
    } catch {}
  }
  const toggleCouponManager = async () => {
    const next = !showCouponManager
    setShowCouponManager(next)
    if (next) await loadCoupons()
  }
  const createCoupon = async () => {
    try {
      const payload = { ...newCoupon, code: String(newCoupon.code || '').toUpperCase(), value: Number(newCoupon.value || 0), minTotal: Number(newCoupon.minTotal || 0), usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined, expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).toISOString() : undefined }
      const res = await authFetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return
      setNewCoupon({ code: '', type: 'percent', value: 0, minTotal: 0, expiresAt: '', active: true, usageLimit: '' })
      await loadCoupons()
    } catch {}
  }
  const updateCoupon = async (c, patch) => {
    try {
      const res = await authFetch(`/api/coupons/${c.code}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
      if (!res.ok) return
      await loadCoupons()
    } catch {}
  }
  const deleteCoupon = async (c) => {
    try {
      const res = await authFetch(`/api/coupons/${c.code}`, { method: 'DELETE' })
      if (!res.ok) return
      await loadCoupons()
    } catch {}
  }

  
  if (loading) {
    return <p>🔄 Đang tải thông tin người dùng...</p>;
  }

  // Trường hợp user null (dù đã check isAuthenticated)
  if (!user) {
    return <p>⚠️ Không thể tải thông tin người dùng.</p>;
  }

  return (
    <div className="dashboard-container">
      <p>👋 Chào mừng, <strong>{user.username}</strong></p>
      <p>🔑 Vai trò: <strong>{user.role}</strong></p>

      {/* ADMIN ZONE */}
      {user.role === 'admin' && (
        <div className="admin-section">
          <h3>⚙️ Quản trị viên - Chức năng quản lý</h3>
          <div className="admin-buttons">
            {/* <button onClick={() => navigate('/admin/users')}>👥 Quản lý người dùng</button>
            <button onClick={() => navigate('/admin/system')}>🛠️ Quản lý hệ thống</button> */}
            <button onClick={() => setShowAdminProductManager(true)}>✏️ Chỉnh sửa sản phẩm</button>
            <button onClick={seedProducts} disabled={seeding}>{seeding ? 'Đang đồng bộ...' : 'Đồng bộ sản phẩm từ file'}</button>
            <button onClick={handleToggleUserManager}>👥 Xem danh sách người dùng</button>
            <button onClick={toggleCouponManager}>🏷️ Mã giảm giá</button>
          </div>

          
          {showAdminProductManager && (
            <div className="edit-product-wrapper">
              <h4>📝 Trình chỉnh sửa sản phẩm</h4>
              <AdminProductManager />
            </div>
          )}
          {showUserManager && (
            <div className="edit-product-wrapper">
              <h4>👥 Danh sách người dùng</h4>
              {usersList.map(u => (
                <div key={u.id} className="product-card">
                  <p><strong>Tên:</strong> {u.username}</p>
                  <p><strong>Vai trò:</strong> {u.role}</p>
                  <p><strong>Trạng thái:</strong> {u.active ? 'Hoạt động' : 'Khóa'}</p>
                  <div className="admin-buttons">
                    <button onClick={() => toggleActive(u)}>{u.active ? 'Khóa' : 'Mở khóa'}</button>
                    {u.role !== 'admin' && (
                      <button onClick={() => deleteUser(u.id)}>Xóa</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCouponManager && (
            <div className="edit-product-wrapper">
              <h4>🏷️ Quản lý mã giảm giá</h4>
              <div className="product-card" style={{ padding: 12 }}>
                <input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} placeholder="Mã" />
                <select value={newCoupon.type} onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}>
                  <option value="percent">Phần trăm</option>
                  <option value="fixed">Số tiền</option>
                </select>
                <input type="number" value={newCoupon.value} onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })} placeholder="Giá trị" />
                <input type="number" value={newCoupon.minTotal} onChange={(e) => setNewCoupon({ ...newCoupon, minTotal: e.target.value })} placeholder="Đơn tối thiểu" />
                <input value={newCoupon.expiresAt} onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} placeholder="Hết hạn ISO" />
                <input value={newCoupon.usageLimit} onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} placeholder="Giới hạn dùng" />
                <button onClick={createCoupon}>Thêm mã</button>
              </div>
              {coupons.map(c => (
                <div key={c.code} className="product-card" style={{ padding: 12 }}>
                  <div><strong>{c.code}</strong> • {c.type} • {c.value}</div>
                  <div>Áp dụng tối thiểu: {c.minTotal || 0} • Hết hạn: {c.expiresAt ? new Date(c.expiresAt).toLocaleString() : 'Không'}</div>
                  <div>Trạng thái: {c.active ? 'Đang hoạt động' : 'Tắt'} • Đã dùng: {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</div>
                  <div className="admin-buttons">
                    <button onClick={() => updateCoupon(c, { active: !c.active })}>{c.active ? 'Tắt' : 'Bật'}</button>
                    <button onClick={() => updateCoupon(c, { value: c.value + 1 })}>+ Giá trị</button>
                    <button onClick={() => deleteCoupon(c)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USER ZONE */}
      {user.role === 'user' && (
        <div className="user-section">
          <h3>👤 Người dùng thường</h3>
          <p>Bạn có thể xem và cập nhật thông tin cá nhân tại đây.</p>
          <button onClick={()=>setshowttcn(true)}>thông tin cá nhân</button>
          {showttcn && (
            <div className="edit-product-wrapper">
              <Canhan />
            </div>
          )}
          {/* Có thể thêm form cập nhật thông tin tại đây */}
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>🚪 Đăng xuất</button>
      
    </div>
  );
};

export default Dashboard;
