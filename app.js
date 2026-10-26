import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC7TQC73r-yOFnAldfDhtSTuOhmaOi8ahg",
  authDomain: "test-pro-990de.firebaseapp.com",
  projectId: "test-pro-990de",
  storageBucket: "test-pro-990de.firebasestorage.app",
  messagingSenderId: "963139884729",
  appId: "1:963139884729:web:8782823cb72ca3b4af2d68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const studentForm = document.getElementById("student-login-form");

    if (studentForm) {
        studentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Lấy thông tin học sinh nhập
            const testCode = document.getElementById("test-code").value.trim().toUpperCase();
            const studentName = document.getElementById("student-name").value.trim();
            
            // THÊM MỚI: Lấy thông tin Lớp
            const studentClass = document.getElementById("student-class").value.trim(); 
            
            const btnSubmit = studentForm.querySelector('button[type="submit"]');

            // THÊM MỚI: Bắt buộc nhập cả Lớp
            if (!testCode || !studentName || !studentClass) {
                return alert("Vui lòng nhập đầy đủ Mã đề, Họ tên và Lớp!");
            }

            // Đổi giao diện nút bấm trong lúc chờ mạng
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Đang kiểm tra mã đề...";

            try {
                // Lệnh Firebase: Tìm trong bảng 'exams' xem có mã đề nào khớp không
                const q = query(collection(db, "exams"), where("examCode", "==", testCode));
                const querySnapshot = await getDocs(q);

                // Nếu không tìm thấy
                if (querySnapshot.empty) {
                    alert("❌ Mã đề thi không tồn tại. Vui lòng kiểm tra lại!");
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Vào làm bài";
                    return;
                }

                // Nếu tìm thấy mã đề
                let examId = "";
                let examData = null;
                
                querySnapshot.forEach((doc) => {
                    examId = doc.id;
                    examData = doc.data();
                });

                // LƯU THÔNG TIN VÀO BỘ NHỚ TẠM (SESSION)
                sessionStorage.setItem("studentName", studentName);
                
                // THÊM MỚI: Lưu Tên Lớp vào bộ nhớ tạm để truyền cho file exam.js
                sessionStorage.setItem("studentClass", studentClass); 
                
                sessionStorage.setItem("examId", examId);
                sessionStorage.setItem("examTitle", examData.title);
                sessionStorage.setItem("examDuration", examData.duration);
                
                // Lệnh chuyển hướng sang trang thi
                window.location.href = "exam.html";

            } catch (error) {
                console.error("Lỗi khi vào thi:", error);
                alert("Có lỗi kết nối máy chủ. Vui lòng thử lại!");
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Vào làm bài";
            }
        });
    }
});