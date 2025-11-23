import React, { useEffect, useState} from 'react';
import { useNavigate,Link } from 'react-router-dom';
import useUser from '@/hooks/useUser';
import EditProduct from './EditProduct';
import AdminProductManager from './AdminProductManager';
import './Dashboard.css'; // (nếu bạn có style riêng)
import Canhan from './thongtincanhan';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logoutUser, isAuthenticated, loading } = useUser();
  const [showAdminProductManager, setShowAdminProductManager] = useState(false);
  const [showttcn,setshowttcn] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [usersList, setUsersList] = useState([]);

  // Điều hướng về login nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Đăng xuất
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsersList(data.users || []);
    } catch {}
  };

  const handleToggleUserManager = async () => {
    const next = !showUserManager;
    setShowUserManager(next);
    if (next) await loadUsers();
  };

  const deleteUser = async (id) => {
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      await loadUsers();
    } catch {}
  };

  const toggleActive = async (u) => {
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(`/api/v1/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !u.active })
      });
      if (!res.ok) return;
      await loadUsers();
    } catch {}
  };

  // Đang loading
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
            <button onClick={handleToggleUserManager}>👥 Xem danh sách người dùng</button>
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
