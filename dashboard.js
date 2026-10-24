import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7TQC73r-yOFnAldfDhtSTuOhmaOi8ahg",
  authDomain: "test-pro-990de.firebaseapp.com",
  projectId: "test-pro-990de",
  storageBucket: "test-pro-990de.firebasestorage.app",
  messagingSenderId: "963139884729",
  appId: "1:963139884729:web:8782823cb72ca3b4af2d68"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let allQuestions = []; 
let allResults = []; 

// --- TẢI DANH SÁCH CÂU HỎI ---
async function loadQuestions() {
    const tableBody = document.getElementById("questions-table-body");
    const questionSelector = document.getElementById("exam-question-selector");
    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "questions"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        allQuestions = []; tableBody.innerHTML = ""; 
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">Chưa có câu hỏi nào.</td></tr>`;
            if (questionSelector) questionSelector.innerHTML = "<span style='color:red;'>Hãy thêm câu hỏi trước!</span>";
            document.getElementById("stat-questions").textContent = "0"; return;
        }
        let stt = 1; let selectorHtml = "";
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allQuestions.push({ id: docSnap.id, ...data });
            
            let typeLabel = data.type === "TF" ? "Phần II" : (data.type === "SHORT" ? "Phần III" : "Phần I");
            let shortContent = data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content;

            tableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #e5e7eb">
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${stt}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #2563eb; font-weight: bold;">${typeLabel}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;" title="${data.content}">${shortContent}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; color: #10b981; text-align: center; font-weight: bold;">${data.correct}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Mức ${data.level || 1}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; color: #ef4444; text-align: center; font-weight: bold;">${data.points || 0.25}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                        <button class="btn-delete-q" data-id="${docSnap.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                    </td>
                </tr>`;
                
            selectorHtml += `<div style="margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                <input type="checkbox" name="exam-question-cb" value="${docSnap.id}" style="width: 16px; height: 16px; margin-top: 2px; cursor: pointer; flex-shrink: 0;">
                <label style="cursor: pointer; line-height: 1.4; font-size: 13px;"><b>Câu ${stt} (${data.points || 0.25}đ):</b> ${shortContent}</label>
            </div>`;
            stt++;
        });
        if (questionSelector) questionSelector.innerHTML = selectorHtml;
        document.getElementById("stat-questions").textContent = allQuestions.length;
        document.querySelectorAll('.btn-delete-q').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa câu hỏi này?")) { await deleteDoc(doc(db, "questions", e.target.getAttribute('data-id'))); loadQuestions(); }
            });
        });
    } catch (error) { console.error(error); }
}

async function loadExams() {
    const tableBody = document.getElementById("exams-table-body");
    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "exams"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        tableBody.innerHTML = "";
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Chưa tạo đề thi nào.</td></tr>`;
            document.getElementById("stat-exams").textContent = "0"; return;
        }
        let stt = 1;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            tableBody.innerHTML += `<tr style="border-bottom: 1px solid #e5e7eb">
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${stt++}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #2563eb;">${data.examCode}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.title}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.duration} phút</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.questions ? data.questions.length : 0}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <button class="btn-delete-exam" data-id="${docSnap.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                </td></tr>`;
        });
        document.getElementById("stat-exams").textContent = stt - 1;
        document.querySelectorAll('.btn-delete-exam').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa đề thi này?")) { await deleteDoc(doc(db, "exams", e.target.getAttribute('data-id'))); loadExams(); }
            });
        });
    } catch (error) { console.error(error); }
}

async function loadResults() {
    const tableBody = document.getElementById("results-table-body");
    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "results"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        tableBody.innerHTML = ""; allResults = [];
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Chưa có kết quả.</td></tr>`;
            document.getElementById("stat-results").textContent = "0"; return;
        }
        querySnapshot.forEach(docSnap => allResults.push({ id: docSnap.id, ...docSnap.data() }));
        allResults.sort((a, b) => b.submittedAt - a.submittedAt);
        document.getElementById("stat-results").textContent = allResults.length;
        
        allResults.forEach((data, index) => {
            const dateStr = data.submittedAt ? data.submittedAt.toDate().toLocaleString('vi-VN') : '';
            tableBody.innerHTML += `<tr style="border-bottom: 1px solid #e5e7eb">
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${data.studentName}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.examCode}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.examTitle}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: bold;">${data.score}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.correctCount} / ${data.totalQuestions}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${dateStr}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <button class="btn-delete-result" data-id="${data.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                </td></tr>`;
        });
        document.querySelectorAll('.btn-delete-result').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa kết quả này?")) { await deleteDoc(doc(db, "results", e.target.getAttribute('data-id'))); loadResults(); }
            });
        });
    } catch (error) { console.error(error); }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("user-email").textContent = user.email;
        loadQuestions(); loadExams(); loadResults();
    } else {
        window.location.href = "teacher-login.html";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", () => signOut(auth).catch(console.error));

    // Cấu hình Tabs
    const menuItems = document.querySelectorAll(".menu li");
    const panels = {
        "overview": document.getElementById("overview-panel"),
        "questions": document.getElementById("question-bank-panel"),
        "exams": document.getElementById("exams-panel"),
        "results": document.getElementById("results-panel")
    };
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            Object.values(panels).forEach(p => { if (p) p.style.display = "none"; });
            if (panels[item.getAttribute("data-target")]) panels[item.getAttribute("data-target")].style.display = "block";
        });
    });

    // --- FORM CÂU HỎI ĐƠN ---
    const qTypeSelect = document.getElementById("q-type");
    const answersContainer = document.getElementById("answers-container");
    
    function renderAnswersForm(type) {
        if (type === "MCQ") {
            answersContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="input-group"><label>Đáp án A:</label><input type="text" id="q-optA" required></div>
                    <div class="input-group"><label>Đáp án B:</label><input type="text" id="q-optB" required></div>
                    <div class="input-group"><label>Đáp án C:</label><input type="text" id="q-optC" required></div>
                    <div class="input-group"><label>Đáp án D:</label><input type="text" id="q-optD" required></div>
                </div>
                <div class="input-group" style="margin-top: 10px;"><label>Chọn đáp án đúng:</label>
                <select id="q-correct" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc;" required>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                </select></div>`;
        } else if (type === "TF") {
            answersContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="input-group"><label>Mệnh đề A:</label><input type="text" id="q-optA" required></div>
                    <div class="input-group"><label>Mệnh đề B:</label><input type="text" id="q-optB" required></div>
                    <div class="input-group"><label>Mệnh đề C:</label><input type="text" id="q-optC" required></div>
                    <div class="input-group"><label>Mệnh đề D:</label><input type="text" id="q-optD" required></div>
                </div>
                <label style="display: block; margin-top: 15px; font-weight: bold; font-size: 14px;">Chọn Đúng/Sai cho từng mệnh đề:</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-top: 5px;">
                    <div class="input-group"><label>Đ/Án A:</label><select id="q-correct-a" style="width:100%; padding:8px;"><option value="Đ">Đúng</option><option value="S">Sai</option></select></div>
                    <div class="input-group"><label>Đ/Án B:</label><select id="q-correct-b" style="width:100%; padding:8px;"><option value="Đ">Đúng</option><option value="S">Sai</option></select></div>
                    <div class="input-group"><label>Đ/Án C:</label><select id="q-correct-c" style="width:100%; padding:8px;"><option value="Đ">Đúng</option><option value="S">Sai</option></select></div>
                    <div class="input-group"><label>Đ/Án D:</label><select id="q-correct-d" style="width:100%; padding:8px;"><option value="Đ">Đúng</option><option value="S">Sai</option></select></div>
                </div>`;
        } else if (type === "SHORT") {
            answersContainer.innerHTML = `
                <div class="input-group" style="margin-top: 10px;">
                    <label>Nhập đáp án chính xác (Số hoặc chữ):</label>
                    <input type="text" id="q-correct" placeholder="VD: 3.14 hoặc Hà Nội" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc;" required>
                </div>`;
        }
    }

    if (qTypeSelect) {
        renderAnswersForm(qTypeSelect.value);
        qTypeSelect.addEventListener("change", (e) => renderAnswersForm(e.target.value));
    }

    const addQuestionForm = document.getElementById("add-question-form");
    if (addQuestionForm) {
        addQuestionForm.addEventListener("submit", async (e) => {
            e.preventDefault(); if (!currentUser) return;
            const type = document.getElementById("q-type").value;
            let correctAns = "";

            if (type === "TF") {
                const cA = document.getElementById("q-correct-a").value;
                const cB = document.getElementById("q-correct-b").value;
                const cC = document.getElementById("q-correct-c").value;
                const cD = document.getElementById("q-correct-d").value;
                correctAns = `${cA},${cB},${cC},${cD}`;
            } else {
                correctAns = document.getElementById("q-correct").value.trim().toUpperCase();
            }

            const payload = {
                type: type, level: document.getElementById("q-level").value,
                points: parseFloat(document.getElementById("q-points").value),
                content: document.getElementById("q-content").value.trim(),
                correct: correctAns, teacherId: currentUser.uid, createdAt: serverTimestamp()
            };

            if (type === "MCQ" || type === "TF") {
                payload.optA = document.getElementById("q-optA") ? document.getElementById("q-optA").value.trim() : "";
                payload.optB = document.getElementById("q-optB") ? document.getElementById("q-optB").value.trim() : "";
                payload.optC = document.getElementById("q-optC") ? document.getElementById("q-optC").value.trim() : "";
                payload.optD = document.getElementById("q-optD") ? document.getElementById("q-optD").value.trim() : "";
            }

            try {
                await addDoc(collection(db, "questions"), payload);
                addQuestionForm.reset(); renderAnswersForm(document.getElementById("q-type").value); 
                loadQuestions(); alert("Đã lưu câu hỏi!");
            } catch (error) { console.error(error); }
        });
    }

    // --- TẢI FILE ĐỀ MẪU (.txt) ---
    const btnDownloadSample = document.getElementById("btn-download-sample");
    if (btnDownloadSample) {
        btnDownloadSample.addEventListener("click", () => {
            const sampleContent = `Câu 1: Thủ đô của Việt Nam là gì?
A. Đà Nẵng
B. Hà Nội
C. TP. Hồ Chí Minh
D. Huế
Đáp án: B
Mức độ: 1
Điểm: 0.25

Câu 2: Các nhận định sau đây đúng hay sai?
A. Trái đất hình cầu.
B. Mặt trời quay quanh Trái đất.
C. Nước sôi ở 100 độ C.
D. Một năm có 365 ngày.
Đáp án: Đ,S,Đ,Đ
Mức độ: 2
Điểm: 1

Câu 3: Năm 1945 có sự kiện lịch sử gì quan trọng ở nước ta?
Đáp án: <key = Bác Hồ đọc bản tuyên ngôn độc lập>
Mức độ: 3
Điểm: 0.5`;
            const blob = new Blob(["\ufeff", sampleContent], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `De_Mau_Test_Pro.docx.txt`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    }

    // --- XỬ LÝ UPLOAD FILE WORD (.DOCX) SỬ DỤNG MAMMOTH.JS ---
    const uploadDocx = document.getElementById("upload-docx");
    const bulkInput = document.getElementById("bulk-questions-input");
    const bulkPreview = document.getElementById("bulk-preview");

    if (uploadDocx) {
        uploadDocx.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Kiểm tra đuôi file
            if (!file.name.endsWith('.docx')) {
                alert("Hệ thống chỉ hỗ trợ file Word định dạng .docx!");
                this.value = ""; 
                return;
            }

            bulkPreview.innerHTML = `<span style="color: #eab308;">⏳ Đang đọc file Word, vui lòng đợi...</span>`;

            const reader = new FileReader();
            reader.onload = function(loadEvent) {
                const arrayBuffer = loadEvent.target.result;
                
                // Gọi thư viện mammoth (đã nhúng ở HTML)
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(function(result) {
                        const text = result.value;
                        bulkInput.value = text;
                        bulkPreview.innerHTML = `<span style="color: #10b981;">✔ Đã trích xuất văn bản từ file Word! Hãy kiểm tra dữ liệu trong ô và bấm nút "Xử lý" bên dưới.</span>`;
                        uploadDocx.value = ""; // Reset input
                    })
                    .catch(function(error) {
                        console.error(error);
                        bulkPreview.innerHTML = `<span style="color: #ef4444;">❌ Lỗi: Không thể đọc file Word này. Hãy chắc chắn file không bị đặt mật khẩu.</span>`;
                        uploadDocx.value = ""; 
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // --- BỘ NHẬN DIỆN THÔNG MINH ---
    const btnProcessBulk = document.getElementById("btn-process-bulk");
    if (btnProcessBulk) {
        btnProcessBulk.addEventListener("click", async () => {
            const bulkData = document.getElementById("bulk-questions-input").value.trim();
            if (!bulkData || !currentUser) return;

            const rows = bulkData.split('\n'); 
            let questionsToSave = [];
            let currentQ = null;
            let currentField = null;

            for (let i = 0; i < rows.length; i++) {
                let line = rows[i].trim();
                if (!line) continue;

                let cauMatch = line.match(/^Câu\s*\d+\s*[:\.\-]\s*(.*)/i);
                if (cauMatch) {
                    if (currentQ) questionsToSave.push(currentQ);
                    currentQ = {
                        content: cauMatch[1].trim(), optA: "", optB: "", optC: "", optD: "",
                        correct: "", level: "1", points: 0.25, type: "", 
                        teacherId: currentUser.uid, createdAt: serverTimestamp()
                    };
                    currentField = 'content';
                    continue;
                }

                if (!currentQ) continue; 

                let optAMatch = line.match(/^A\.\s*(.*)/i);
                let optBMatch = line.match(/^B\.\s*(.*)/i);
                let optCMatch = line.match(/^C\.\s*(.*)/i);
                let optDMatch = line.match(/^D\.\s*(.*)/i);
                let ansMatch = line.match(/^Đáp án\s*:\s*(.*)/i);
                let levelMatch = line.match(/^Mức độ\s*:\s*(.*)/i);
                let pointMatch = line.match(/^Điểm\s*:\s*(.*)/i);

                if (optAMatch) { currentQ.optA = optAMatch[1].trim(); currentField = 'optA'; }
                else if (optBMatch) { currentQ.optB = optBMatch[1].trim(); currentField = 'optB'; }
                else if (optCMatch) { currentQ.optC = optCMatch[1].trim(); currentField = 'optC'; }
                else if (optDMatch) { currentQ.optD = optDMatch[1].trim(); currentField = 'optD'; }
                else if (ansMatch) { 
                    let rawAns = ansMatch[1].trim();
                    let keyMatch = rawAns.match(/<key\s*=\s*(.*?)>/i);

                    if (keyMatch) {
                        currentQ.correct = keyMatch[1].trim();
                        currentQ.type = "SHORT";
                    } else {
                        let upperAns = rawAns.toUpperCase().replace(/\s+/g, '');
                        let dsMatch = upperAns.match(/^[ĐS],[ĐS],[ĐS],[ĐS]$/); 

                        if (['A', 'B', 'C', 'D'].includes(upperAns)) {
                            currentQ.correct = upperAns;
                            currentQ.type = "MCQ";
                        } else if (dsMatch) {
                            currentQ.correct = upperAns;
                            currentQ.type = "TF";
                        } else {
                            currentQ.correct = rawAns; 
                            currentQ.type = "SHORT";
                        }
                    }
                    currentField = 'correct'; 
                }
                else if (levelMatch) { currentQ.level = levelMatch[1].trim(); currentField = 'level'; }
                else if (pointMatch) { currentQ.points = parseFloat(pointMatch[1].trim().replace(',', '.')) || 0.25; currentField = 'points'; }
                else {
                    if (currentField && currentQ[currentField] !== undefined) {
                        currentQ[currentField] += "\n" + line;
                    }
                }
            }
            if (currentQ) questionsToSave.push(currentQ); 

            // Cập nhật lại Type chắc chắn lần cuối để chống lỗi mất Phần III
            questionsToSave.forEach(q => {
                if (!q.optA && !q.optB && !q.optC && !q.optD) {
                    q.type = "SHORT"; // Nếu không có A B C D thì CHẮC CHẮN là tự luận
                }
            });

            if (questionsToSave.length > 0) {
                btnProcessBulk.disabled = true;
                bulkPreview.innerHTML = `<span style="color: #eab308;">Đang lưu ${questionsToSave.length} câu hỏi...</span>`;
                try {
                    await Promise.all(questionsToSave.map(q => addDoc(collection(db, "questions"), q)));
                    document.getElementById("bulk-questions-input").value = ""; 
                    loadQuestions(); 
                    bulkPreview.innerHTML = `<span style="color: #10b981;">✔ Đã nhận diện và lưu thành công ${questionsToSave.length} câu!</span>`;
                } catch(err) {
                    console.error(err);
                    bulkPreview.innerHTML = `<span style="color: #ef4444;">Lỗi khi lưu dữ liệu!</span>`;
                } finally {
                    btnProcessBulk.disabled = false;
                }
            } else {
                alert("Không nhận diện được câu hỏi nào. Đảm bảo bắt đầu bằng chữ 'Câu 1:'");
            }
        });
    }

    // TẠO ĐỀ THI
    const createExamForm = document.getElementById("create-exam-form");
    if (createExamForm) {
        createExamForm.addEventListener("submit", async (e) => {
            e.preventDefault(); if (!currentUser) return;
            const selected = document.querySelectorAll('input[name="exam-question-cb"]:checked');
            if (selected.length === 0) return alert("Chọn ít nhất 1 câu hỏi!");
            const examCode = document.getElementById("exam-code").value.trim().toUpperCase();
            let qsData = []; selected.forEach(cb => { const q = allQuestions.find(i => i.id === cb.value); if(q) qsData.push(q); });
            
            const qCheck = query(collection(db, "exams"), where("examCode", "==", examCode));
            if (!(await getDocs(qCheck)).empty) return alert("Mã đề đã tồn tại!");
            
            await addDoc(collection(db, "exams"), {
                examCode: examCode, title: document.getElementById("exam-title").value.trim(), duration: parseInt(document.getElementById("exam-duration").value),
                questions: qsData, teacherId: currentUser.uid, createdAt: serverTimestamp()
            });
            createExamForm.reset(); loadExams(); alert("Tạo đề thi thành công!");
        });
    }

    // XUẤT EXCEL
    const btnExport = document.getElementById("btn-export-csv");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            if (allResults.length === 0) return alert("Chưa có kết quả!");
            let csvContent = "STT,Tên học sinh,Mã đề,Tên đề thi,Điểm,Số câu đúng,Thời gian nộp bài\n";
            allResults.forEach((r, i) => {
                const date = r.submittedAt ? r.submittedAt.toDate().toLocaleString('vi-VN') : '';
                csvContent += `${i + 1},"${r.studentName}","${r.examCode}","${r.examTitle}",${r.score},"${r.correctCount}/${r.totalQuestions}","${date}"\n`;
            });
            const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `Ket_Qua_${new Date().getTime()}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    }
});