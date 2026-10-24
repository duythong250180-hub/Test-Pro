// Nhúng thư viện Firebase trực tiếp từ máy chủ Google (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC7TQC73r-yOFnAldfDhtSTuOhmaOi8ahg",
  authDomain: "test-pro-990de.firebaseapp.com",
  projectId: "test-pro-990de",
  storageBucket: "test-pro-990de.firebasestorage.app",
  messagingSenderId: "963139884729",
  appId: "1:963139884729:web:8782823cb72ca3b4af2d68"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Xử lý sự kiện đăng nhập khi trang đã tải xong
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("teacher-login-form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Ngăn trình duyệt tải lại trang khi bấm submit
            
            // Lấy dữ liệu người dùng nhập
            const email = document.getElementById("teacher-email").value.trim();
            const password = document.getElementById("teacher-password").value.trim();

            // Gọi hàm đăng nhập của Firebase
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Thành công
                    alert("Đăng nhập thành công!");
                    // Chuyển hướng sang trang quản trị (chúng ta sẽ tạo ở bước sau)
                    window.location.href = "dashboard.html";
                })
                .catch((error) => {
                    // Thất bại (sai pass, sai email...)
                    alert("Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu!");
                    console.error("Mã lỗi Firebase:", error.code);
                });
        });
    }
});