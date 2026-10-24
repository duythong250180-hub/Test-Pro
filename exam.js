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
        window.location.href = "index.html"; return;
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
            alert("Đề thi không tồn tại!"); window.location.href = "index.html";
        }
    } catch (error) {
        console.error(error); alert("Lỗi tải đề thi!");
    }

    function renderQuestions(questions) {
        let html = "";
        let qIndex = 1; 
        
        // Chia mảng thành 3 phần dựa trên Type đã bóc tách từ Dashboard
        const mcq = questions.filter(q => q.type === 'MCQ');
        const tf = questions.filter(q => q.type === 'TF');
        const short = questions.filter(q => q.type === 'SHORT');

        // PHẦN I
        if (mcq.length > 0) {
            html += `<div class="section-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn</div>`;
            mcq.forEach(q => {
                html += `
                <div class="question-card" data-type="MCQ" data-correct="${q.correct}" data-points="${q.points || 0.25}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${q.content}</div>
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
                <div class="question-card" data-type="TF" data-correct="${q.correct}" data-points="${q.points || 1}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${q.content}</div>
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
                <div class="question-card" data-type="SHORT" data-correct="${q.correct}" data-points="${q.points || 0.5}">
                    <div class="question-title"><b>Câu ${qIndex}:</b> ${q.content}</div>
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
            if (timeRemaining <= 0) { clearInterval(timerInterval); alert("Hết giờ! Tự động nộp bài."); submitExam(); }
        }, 1000);
    }

    const examForm = document.getElementById("exam-form");
    examForm.addEventListener("submit", (e) => {
        e.preventDefault(); if (confirm("Bạn có chắc chắn nộp bài?")) submitExam();
    });

    async function submitExam() {
        clearInterval(timerInterval); 
        btnSubmit.disabled = true; btnSubmit.textContent = "Đang chấm điểm...";

        let score = 0; let correctCount = 0;
        const cards = document.querySelectorAll('.question-card');
        
        cards.forEach((card, idx) => {
            const type = card.getAttribute('data-type');
            const correctAns = card.getAttribute('data-correct');
            const points = parseFloat(card.getAttribute('data-points'));
            const qNum = idx + 1;

            if (type === 'MCQ') {
                const selected = document.querySelector(`input[name="q_${qNum}"]:checked`);
                if (selected && selected.value === correctAns) { score += points; correctCount++; }
            } 
            else if (type === 'TF') {
                const selA = document.querySelector(`input[name="q_${qNum}_A"]:checked`)?.value || "";
                const selB = document.querySelector(`input[name="q_${qNum}_B"]:checked`)?.value || "";
                const selC = document.querySelector(`input[name="q_${qNum}_C"]:checked`)?.value || "";
                const selD = document.querySelector(`input[name="q_${qNum}_D"]:checked`)?.value || "";
                const studentAns = `${selA},${selB},${selC},${selD}`;
                
                if (selA && selB && selC && selD && studentAns === correctAns) { score += points; correctCount++; }
            } 
            else if (type === 'SHORT') {
                const input = document.querySelector(`input[name="q_${qNum}"]`);
                if (input && input.value.trim().toUpperCase() === correctAns.toUpperCase()) { score += points; correctCount++; }
            }
        });

        score = Math.round(score * 100) / 100;
        try {
           await addDoc(collection(db, "results"), {
    examId: examId, 
    examTitle: examTitle, 
    examCode: examData.examCode, // (Giữ nguyên các trường cũ của bạn)
    studentName: studentName, 
    studentClass: studentClass,  // <--- THÊM DÒNG NÀY VÀO ĐÂY
    score: score, 
    correctCount: correctCount,
    totalQuestions: cards.length, 
    teacherId: examData.teacherId
});
            sessionStorage.clear();
            alert(`🎉 NỘP BÀI THÀNH CÔNG!\n- Điểm của bạn: ${score}\n- Số câu đúng: ${correctCount} / ${cards.length}`);
            window.location.href = "index.html"; 
        } catch (error) {
            console.error(error); alert("Lỗi lưu điểm!"); btnSubmit.disabled = false; btnSubmit.textContent = "Thử nộp lại";
        }
    }
});