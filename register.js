import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 1. CẤU HÌNH KẾT NỐI FIREBASE (COPY TỪ FILE auth.js SANG ĐÂY)
const firebaseConfig = {
  apiKey: "AIzaSyC7TQC73r-yOFnAldfDhtSTuOhmaOi8ahg",
  authDomain: "test-pro-990de.firebaseapp.com",
  projectId: "test-pro-990de",
  storageBucket: "test-pro-990de.firebasestorage.app",
  messagingSenderId: "963139884729",
  appId: "1:963139884729:web:8782823cb72ca3b4af2d68"
};

// 2. KHỞI TẠO FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. XỬ LÝ SỰ KIỆN KHI BẤM NÚT ĐĂNG KÝ
const registerForm = document.getElementById('teacher-register-form');

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Lệnh Firebase tạo tài khoản mới
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Đăng ký tài khoản thành công! Hãy đăng nhập bằng tài khoản vừa tạo.");
                window.location.href = "teacher-login.html"; // Chuyển về trang đăng nhập
            })
            .catch((error) => {
                const errorCode = error.code;
                if (errorCode === 'auth/email-already-in-use') {
                    alert("Lỗi: Email này đã được sử dụng!");
                } else if (errorCode === 'auth/weak-password') {
                    alert("Lỗi: Mật khẩu quá yếu, vui lòng nhập ít nhất 6 ký tự!");
                } else {
                    alert("Lỗi hệ thống: " + error.message);
                }
            });
    });
}