import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUser from '../hooks/useUser';
import './admin.css';
import { safeGetJSON, safeSetJSON } from '../utils/storage'; // added safeSetJSON

export default function Admin() {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDevHelper, setShowDevHelper] = useState(false);

  useEffect(() => {
    const currentUser = safeGetJSON('currentUser');
    if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') {
      
      if (process.env.NODE_ENV === 'development') {
        setShowDevHelper(true);
        return;
      }
      navigate('/login', { replace: true });
      return;
    }
    fetchUsers();
  }, [isAuthenticated, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Không thể tải danh sách người dùng.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa người dùng này?')) return;
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Xóa thất bại.');
        return;
      }
      alert('Xóa thành công.');
      await fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const handlePromote = async (id) => {
    if (!window.confirm('Cấp quyền admin cho người dùng này?')) return;
    try {
      const res = await fetch(`/api/v1/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'admin' })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Cập nhật vai trò thất bại.');
        return;
      }
      alert('Cập nhật vai trò thành công.');
      await fetchUsers();
    } catch (err) {
      console.error('Promote user error:', err);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const handleSetLocalAdmin = () => {
    // create a minimal test admin; adjust fields as your backend expects
    const testAdmin = {
      id: 'dev-admin',
      username: 'dev-admin',
      email: 'dev-admin@example.local',
      phone: '0000000000',
      role: 'admin'
    };
    safeSetJSON('currentUser', testAdmin);
    // reload to let the component re-check currentUser and proceed
    window.location.reload();
  };

  const currentUserId = (() => {
    const cu = safeGetJSON('currentUser'); // safe read
    return cu ? (cu.id || cu._id || cu.username) : null;
  })();

  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>

      {/* dev-only helper banner */}
      {showDevHelper && process.env.NODE_ENV === 'development' && (
        <div style={{ margin: '12px 0', padding: '10px', border: '1px dashed #f90', background: '#fff8e6' }}>
          <div style={{ marginBottom: 8 }}>Dev: no admin found. For quick local testing you can create a temporary admin:</div>
          <button onClick={handleSetLocalAdmin} style={{ marginRight: 8 }}>Set local admin and reload</button>
          <small>Only shown in development. This does not modify your backend.</small>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <p>Tổng người dùng: {users.length}</p>
          <div className="users-table">
            <div className="row header">
              <div>Username</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Role</div>
              <div>Actions</div>
            </div>
            {users.map((u) => {
              const uid = u.id || u._id || u.username;
              const isAdmin = u.role === 'admin';
              const disablePromote = isAdmin || uid === currentUserId;
              return (
                <div className="row" key={uid}>
                  <div>{u.username}</div>
                  <div>{u.email}</div>
                  <div>{u.phone}</div>
                  <div>{u.role}</div>
                  <div className="actions">
                    <button onClick={() => handlePromote(uid)} disabled={disablePromote}>
                      Promote
                    </button>
                    <button onClick={() => handleDelete(uid)} disabled={uid === currentUserId}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && <div className="row"><div>Không có người dùng</div></div>}
          </div>
        </>
      )}
    </div>
  );
}
