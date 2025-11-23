// import React, { useState } from 'react';
// import './style.css';

// function Apple() {
//   const [form, setForm] = useState({
//     username: '',
//     email: '',
//     phone: '',
//     password: ''
//   });

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Lấy danh sách người dùng đã lưu trong localStorage
//     const users = JSON.parse(localStorage.getItem('users')) || [];

//     // Kiểm tra xem tên đăng nhập đã tồn tại chưa
//     const userExists = users.some(user => user.username === form.username);
//     if (userExists) {
//       alert('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
//       return;
//     }

//     // Thêm người dùng mới vào danh sách
//     users.push(form);

//     // Lưu danh sách người dùng vào localStorage
//     localStorage.setItem('users', JSON.stringify(users));

//     alert('Đăng ký thành công!');

//     // Reset form sau khi đăng ký thành công
//     setForm({
//       username: '',
//       email: '',
//       phone: '',
//       password: ''
//     });
//   };

//   return (
//     <div className="sign">
//       <h1>Đăng Ký</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Tên đăng nhập"
//           name="username"
//           value={form.username}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="email"
//           placeholder="Email"
//           name="email"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="text"
//           placeholder="Số điện thoại"
//           name="phone"
//           value={form.phone}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Mật khẩu"
//           name="password"
//           value={form.password}
//           onChange={handleChange}
//           required
//         />
//         <button type="submit" className="signup-btn">Đăng Ký</button>
//       </form>
//     </div>
//   );
// }

// export default Apple;



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { safeSetItem, safeSetJSON } from '../../utils/storage'; // added import

function Apple() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role:'user'
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // client-side validation
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(form.phone)) {
      alert('Số điện thoại không hợp lệ.');
      return;
    }
    if (form.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      const res = await fetch('/api/v1/users/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // keep if backend uses cookies; remove if not needed
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.error || body.message || 'Đăng ký thất bại';
        alert(msg);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // persist if backend returns tokens or user
      if (data.accessToken) safeSetItem('accessToken', data.accessToken);
      if (data.refreshToken) safeSetItem('refreshToken', data.refreshToken);
      if (data.user) safeSetJSON('currentUser', data.user);

      alert('Đăng ký thành công!');
      // reset form
      setForm({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'user'
      });

      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      alert('Không thể kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  return (
    <div className="sign">
      <h1>Đăng Ký</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tên đăng nhập"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Số điện thoại"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className="signup-btn">Đăng Ký</button>
      </form>
    </div>
  );
}

export default Apple;
