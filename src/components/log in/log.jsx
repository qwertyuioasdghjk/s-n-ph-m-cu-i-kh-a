import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import useUser from '../../hooks/useUser';
import LoginForm from './loginForm';
import { safeSetItem, safeSetJSON } from '../../utils/storage';

const Login = () => {
  const { isAuthenticated, setLoginUser } = useUser();
  const navigate = useNavigate();

  const [loginFormValue, setLoginFormValue] = useState({
    name: '',
    password: ''
  });

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch('/api/v1/users/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: loginFormValue.name, password: loginFormValue.password })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || 'Đăng nhập thất bại';
        alert(msg);
        return;
      }
      const data = await res.json();
      const user = data.user;
      if (data.accessToken) safeSetItem('accessToken', data.accessToken);
      if (data.refreshToken) safeSetItem('refreshToken', data.refreshToken);
      setLoginUser(user);
      safeSetJSON('currentUser', user);
      alert('Đăng nhập thành công!');
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      alert('Không thể kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  const handleSignupClick = () => navigate('/signup');
  const handleForgotClick = () => alert('Liên hệ quản trị viên để lấy lại mật khẩu.');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="login">
      <h2>{isAuthenticated ? 'Bạn đã đăng nhập' : 'Bạn chưa đăng nhập'}</h2>
      <h1>Đăng Nhập</h1>

      <LoginForm
        formValue={loginFormValue}
        onChange={setLoginFormValue}
        onSubmit={handleLoginSubmit}
        onSignupClick={handleSignupClick}
        onForgotClick={handleForgotClick}
      />
    </div>
  );
};

export default Login;



