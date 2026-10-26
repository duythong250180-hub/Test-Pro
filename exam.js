import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", async () => {
    const studentName = sessionStorage.getItem("studentName");
    const studentClass = sessionStorage.getItem('studentClass');
    const examId = sessionStorage.getItem("examId");
    const examTitle = sessionStorage.getItem("examTitle");
    const examDuration = parseInt(sessionStorage.getItem("examDuration"));

    if (!studentName || !examId) {
        alert("Vui lòng nhập mã đề từ trang chủ!");
        window.location.href = "index.html"; 
        return;
    }

    document.getElementById("display-student-name").textContent = studentName;
    document.getElementById("display-exam-title").textContent = examTitle;
    document.getElementById("display-duration").textContent = examDuration;

    const questionsContainer = document.getElementById("questions-container");
    const btnSubmit = document.getElementById("btn-submit-exam");
    let examData = null;
    let timerInterval;

    try {
        const docRef = doc(db, "exams", examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            examData = docSnap.data();
            document.getElementById("display-exam-code").textContent = examData.examCode;
            renderQuestions(examData.questions);
            startTimer(examDuration);
        } else {
            alert("Đề thi không tồn tại!"); 
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error(error); 
        alert("Lỗi tải đề thi!");
    }

    function renderQuestions(questions) {
        let html = "";
        let qIndex = 1; 
        
        // BỘ LỌC ĐỊNH VỊ: Gắn vị trí gốc (original index) cho từng câu hỏi trước khi chia tách để máy chấm không bị nhầm
        questions.forEach((q, i) => { q.originalIndex = i; });
        
        // Chia mảng thành 3 phần
        const mcq = questions.filter(q => q.type === 'MCQ');
        const tf = questions.filter(q => q.type === 'TF');
        const short = questions.filter(q => q.type === 'SHORT');

        // BỘ LỌC THÔNG MINH: Tự động xóa chữ "Câu X:" thừa trong nội dung gốc
        const cleanContent = (content) => {
            if (!content) return "";
            return content.replace(/^(<[^>]+>)?\s*Câu\s*\d+\s*[:\.\-]?\s*/i, '$1');
        };

        // PHẦN I
        if (mcq.length > 0) {
            html += `<div class="section-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn</div>`;
            mcq.forEach(q => {
                html += `
                <div class="question-card" data-index="${q.originalIndex}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${cleanContent(q.content)}</div>
                    <label class="option-label"><input type="radio" name="q_${qIndex}" value="A" required> A. ${q.optA}</label>
                    <label class="option-label"><input type="radio" name="q_${qIndex}" value="B"> B. ${q.optB}</label>
                    <label class="option-label"><input type="radio" name="q_${qIndex}" value="C"> C. ${q.optC}</label>
                    <label class="option-label"><input type="radio" name="q_${qIndex}" value="D"> D. ${q.optD}</label>
                </div>`;
                qIndex++;
            });
        }

        // PHẦN II
        if (tf.length > 0) {
            html += `<div class="section-title">PHẦN II. Câu trắc nghiệm Đúng / Sai</div>`;
            tf.forEach(q => {
                html += `
                <div class="question-card" data-index="${q.originalIndex}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${cleanContent(q.content)}</div>
                    <table class="tf-table">
                        <tr><th>Mệnh đề</th><th style="width:15%; color:#10b981;">Đúng</th><th style="width:15%; color:#ef4444;">Sai</th></tr>
                        <tr><td class="tf-statement"><b>A.</b> ${q.optA}</td><td><input type="radio" name="q_${qIndex}_A" value="Đ" required></td><td><input type="radio" name="q_${qIndex}_A" value="S"></td></tr>
                        <tr><td class="tf-statement"><b>B.</b> ${q.optB}</td><td><input type="radio" name="q_${qIndex}_B" value="Đ" required></td><td><input type="radio" name="q_${qIndex}_B" value="S"></td></tr>
                        <tr><td class="tf-statement"><b>C.</b> ${q.optC}</td><td><input type="radio" name="q_${qIndex}_C" value="Đ" required></td><td><input type="radio" name="q_${qIndex}_C" value="S"></td></tr>
                        <tr><td class="tf-statement"><b>D.</b> ${q.optD}</td><td><input type="radio" name="q_${qIndex}_D" value="Đ" required></td><td><input type="radio" name="q_${qIndex}_D" value="S"></td></tr>
                    </table>
                </div>`;
                qIndex++;
            });
        }

        // PHẦN III
        if (short.length > 0) {
            html += `<div class="section-title">PHẦN III. Câu trắc nghiệm trả lời ngắn</div>`;
            short.forEach(q => {
                html += `
                <div class="question-card" data-index="${q.originalIndex}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${cleanContent(q.content)}</div>
                    <input type="text" name="q_${qIndex}" class="short-input" placeholder="Nhập đáp án của bạn..." required>
                </div>`;
                qIndex++;
            });
        }

        questionsContainer.innerHTML = html;
        btnSubmit.style.display = "block";
    }

    function startTimer(minutes) {
        let timeRemaining = minutes * 60;
        const displayTimer = document.getElementById("display-timer");
        timerInterval = setInterval(() => {
            timeRemaining--;
            const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
            const s = (timeRemaining % 60).toString().padStart(2, '0');
            displayTimer.textContent = `${m}:${s}`;
            if (timeRemaining <= 0) { 
                clearInterval(timerInterval); 
                alert("Hết giờ! Tự động nộp bài."); 
                submitExam(); 
            }
        }, 1000);
    }

    const examForm = document.getElementById("exam-form");
    examForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        if (confirm("Bạn có chắc chắn nộp bài?")) submitExam();
    });

    async function submitExam() {
        clearInterval(timerInterval); 
        btnSubmit.disabled = true; 
        btnSubmit.textContent = "Đang chấm điểm...";

        let score = 0;
        let correctCount = 0;
        
        const cards = document.querySelectorAll('.question-card');

        try {
            // VÒNG LẶP CHẤM ĐIỂM THÔNG MINH (Đọc theo data-index để không bao giờ bị lệch câu hỏi)
            cards.forEach((card) => {
                const realIndex = card.getAttribute('data-index');
                const q = examData.questions[realIndex];
                if (!q) return; 

                // Chuẩn hóa đáp án (chữ in hoa, xóa khoảng trắng thừa)
                let correctAnswer = q.correct ? String(q.correct).trim().toUpperCase() : "";

                if (q.type === "TF") {
                    // Tự động đổi chữ D (tiếng Anh) thành Đ (tiếng Việt)
                    correctAnswer = correctAnswer.replace(/D/g, 'Đ').replace(/\s+/g, '');
                    
                    const studentInputs = card.querySelectorAll('select, input[type="radio"]:checked'); 
                    let studentAnswers = [];
                    studentInputs.forEach(input => studentAnswers.push(input.value.trim().toUpperCase()));

                    const correctArr = correctAnswer.split(',');
                    let partialCorrect = 0;

                    for (let i = 0; i < 4; i++) {
                        if (studentAnswers[i] && correctArr[i] && studentAnswers[i] === correctArr[i]) {
                            partialCorrect++;
                        }
                    }
                    
                    // Tính điểm: Lấy tổng điểm của câu chia 4
                    const questionPoint = parseFloat(q.points || 1);
                    score += partialCorrect * (questionPoint / 4);
                    
                    if (partialCorrect === 4) {
                        correctCount++;
                    }

                } else if (q.type === "MCQ") {
                    const selected = card.querySelector('input[type="radio"]:checked');
                    if (selected && selected.value === correctAnswer) {
                        score += parseFloat(q.points || 0.25);
                        correctCount++;
                    }
                } else if (q.type === "SHORT") {
                    const input = card.querySelector('input[type="text"]');
                    if (input) {
                        // Tối ưu: Xóa toàn bộ dấu cách để chấm chính xác hơn
                        const studentAns = input.value.trim().toUpperCase().replace(/\s+/g, '');
                        const finalCorrect = correctAnswer.replace(/\s+/g, '');
                        if (studentAns !== "" && studentAns === finalCorrect) {
                            score += parseFloat(q.points || 0.5);
                            correctCount++;
                        }
                    }
                }
            });

            // Làm tròn 2 chữ số thập phân
            score = Math.round(score * 100) / 100;

        } catch (calcError) {
            console.error("Lỗi trong lúc tính điểm:", calcError);
            alert("Có lỗi xảy ra khi đọc dữ liệu câu hỏi. Hãy báo cho giáo viên.");
            btnSubmit.textContent = "Nộp bài";
            btnSubmit.disabled = false;
            return; 
        }

        try {
            // LƯU KẾT QUẢ LÊN MÁY CHỦ
            await addDoc(collection(db, "results"), {
                examId: examId,
                examTitle: examTitle,
                examCode: examData.examCode,
                studentName: studentName,
                studentClass: studentClass,
                score: score,
                correctCount: correctCount,
                totalQuestions: cards.length,
                teacherId: examData.teacherId, 
                submittedAt: serverTimestamp() 
            });
            
            sessionStorage.clear();
            alert(`🎉 NỘP BÀI THÀNH CÔNG!\nĐiểm của bạn: ${score}\nSố câu đúng: ${correctCount} / ${cards.length}`);
            window.location.href = "index.html"; 
            
        } catch (error) {
            console.error(error); 
            alert("Lỗi lưu điểm! Vui lòng kiểm tra lại kết nối mạng."); 
            btnSubmit.disabled = false; 
            btnSubmit.textContent = "Thử nộp lại";
        }
    }
});