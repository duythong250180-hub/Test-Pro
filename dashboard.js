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
let parsedBulkQuestions = []; 

// ==========================================
// 1. TẢI VÀ HIỂN THỊ NGÂN HÀNG CÂU HỎI
// ==========================================
async function loadQuestions() {
    const tableBody = document.getElementById("questions-table-body");
    const questionSelector = document.getElementById("exam-question-selector");
    const btnDeleteSelected = document.getElementById("btn-delete-selected-q");
    const cbSelectAll = document.getElementById("cb-select-all-q");
    
    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "questions"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        allQuestions = []; 
        tableBody.innerHTML = ""; 
        
        if (cbSelectAll) cbSelectAll.checked = false;
        if (btnDeleteSelected) btnDeleteSelected.style.display = "none";

        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Chưa có câu hỏi nào.</td></tr>`;
            if (questionSelector) questionSelector.innerHTML = "<span style='color:red;'>Hãy thêm câu hỏi trước!</span>";
            document.getElementById("stat-questions").textContent = "0"; 
            return;
        }
        
        querySnapshot.forEach((docSnap) => {
            allQuestions.push({ id: docSnap.id, ...docSnap.data() });
        });

        const typeOrder = { 'MCQ': 1, 'TF': 2, 'SHORT': 3 };
        allQuestions.sort((a, b) => (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4));

        let tableHtml = "";
        let selectorHtml = "";
        let stt = 1; 

        allQuestions.forEach((data) => {
            let typeLabel = data.type === "TF" ? "Phần II" : (data.type === "SHORT" ? "Phần III" : "Phần I");
            let shortContent = data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content;
            shortContent = shortContent.replace(/^(<[^>]+>)?\s*Câu\s*\d+\s*[:\.\-]?\s*/i, '$1');

            // BẢNG NGÂN HÀNG CÂU HỎI (Đã chuẩn 8 cột)
            tableHtml += `
                <tr style="border-bottom: 1px solid #e5e7eb">
                    <td style="padding: 10px; text-align: center;">
                        <input type="checkbox" class="cb-q-item" value="${data.id}">
                    </td>
                    <td style="padding: 10px; text-align: center;">${stt}</td>
                    <td style="padding: 10px; text-align: center; font-weight: bold; color: #2563eb;">${typeLabel}</td>
                    <td style="padding: 10px; text-align: left;">${shortContent}</td>
                    <td style="padding: 10px; text-align: center; color: #10b981; font-weight: bold;">${data.correct || ""}</td>
                    <td style="padding: 10px; text-align: center;">Mức ${data.level || 1}</td>
                    <td style="padding: 10px; text-align: center; color: #ef4444; font-weight: bold;">${data.points || 0.25}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="btn-delete-q" data-id="${data.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                    </td>
                </tr>
            `;

            // DANH SÁCH CHỌN CÂU HỎI (Ép cứng bố cục hàng ngang bằng Flexbox)
            selectorHtml += `
                <label style="display: flex; flex-direction: row; align-items: flex-start; padding: 10px; border-bottom: 1px solid #e5e7eb; cursor: pointer; background: #fff; margin: 0; width: 100%; box-sizing: border-box;">
                    <input type="checkbox" name="exam-question-cb" class="cb-q-item-exam" value="${data.id}" style="margin: 4px 12px 0 0; flex-shrink: 0; width: 16px; height: 16px; cursor: pointer;">
                    <div style="flex-grow: 1; text-align: left; width: 100%; display: block;">
                        <div style="font-weight: bold; color: #1d4ed8; font-size: 13px; margin-bottom: 4px;">${typeLabel} - Câu ${stt}</div>
                        <div style="font-size: 13px; color: #374151; line-height: 1.4; word-break: break-word;">${shortContent}</div>
                    </div>
                </label>
            `;
            stt++;
        });
        
        tableBody.innerHTML = tableHtml;
        if (questionSelector) {
            // Ép khung chứa bên ngoài thành block thông thường để phá vỡ lưới (grid) của form
            questionSelector.innerHTML = `<div style="display: block; width: 100%; text-align: left;">${selectorHtml}</div>`;
        }
        document.getElementById("stat-questions").textContent = allQuestions.length;

        document.querySelectorAll('.btn-delete-q').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa câu hỏi này?")) { 
                    await deleteDoc(doc(db, "questions", e.target.getAttribute('data-id'))); 
                    loadQuestions(); 
                }
            });
        });

        const itemCheckboxes = document.querySelectorAll('.cb-q-item');
        itemCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('.cb-q-item:checked').length;
                if (btnDeleteSelected) btnDeleteSelected.style.display = checkedCount > 0 ? "block" : "none";
                if (cbSelectAll) cbSelectAll.checked = (checkedCount === itemCheckboxes.length && itemCheckboxes.length > 0);
            });
        });

    } catch (error) { console.error(error); }
}
// ==========================================
// 2. TẢI VÀ HIỂN THỊ KẾT QUẢ CỦA HỌC SINH
// ==========================================
async function loadResults() {
    const tableBody = document.getElementById("results-table-body");
    const btnDeleteSelectedR = document.getElementById("btn-delete-selected-r");
    const cbSelectAllR = document.getElementById("cb-select-all-r");

    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "results"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        tableBody.innerHTML = ""; 
        allResults = [];

        if (cbSelectAllR) cbSelectAllR.checked = false;
        if (btnDeleteSelectedR) btnDeleteSelectedR.style.display = "none";

        if (querySnapshot.empty) {
            // Sửa lại colspan=10 cho khớp với 10 cột của bảng
            tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 20px;">Chưa có kết quả thi.</td></tr>`;
            document.getElementById("stat-results").textContent = "0"; 
            return;
        }
        
        let stt = 1;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allResults.push({ id: docSnap.id, ...data });
            
            const dateStr = data.submittedAt ? data.submittedAt.toDate().toLocaleString('vi-VN') : '';
            // Bắt thêm trường hợp biến lưu tên lớp có thể là studentClass hoặc class
            const lop = data.studentClass || data.class || ""; 
            const examTitle = data.examTitle || "Không có tên";

            // Sinh chính xác 10 thẻ <td> khớp với 10 cột HTML
            tableBody.innerHTML += `
                <tr style="border-bottom: 1px solid #e5e7eb">
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                        <input type="checkbox" class="cb-r-item" value="${docSnap.id}">
                    </td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${stt++}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${data.studentName || ""}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${lop}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #2563eb; font-weight: bold;">${data.examCode || ""}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${examTitle}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: bold;">${data.score || 0}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.correctCount || 0} / ${data.totalQuestions || 0}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${dateStr}</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                        <button class="btn-delete-result" data-id="${docSnap.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                    </td>
                </tr>
            `;
        });
        
        document.getElementById("stat-results").textContent = stt - 1;
        
        document.querySelectorAll('.btn-delete-result').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa kết quả này?")) { 
                    await deleteDoc(doc(db, "results", e.target.getAttribute('data-id'))); 
                    loadResults(); 
                }
            });
        });

        const rCheckboxes = document.querySelectorAll('.cb-r-item');
        rCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('.cb-r-item:checked').length;
                if (btnDeleteSelectedR) btnDeleteSelectedR.style.display = checkedCount > 0 ? "inline-block" : "none";
                if (cbSelectAllR) cbSelectAllR.checked = (checkedCount === rCheckboxes.length && rCheckboxes.length > 0);
            });
        });
    } catch (error) { console.error(error); }
}
// ==========================================
// 3. TẢI VÀ HIỂN THỊ ĐỀ THI ĐÃ TẠO
// ==========================================
async function loadExams() {
    const tableBody = document.getElementById("exams-table-body");
    if (!currentUser || !tableBody) return;
    try {
        const q = query(collection(db, "exams"), where("teacherId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        tableBody.innerHTML = "";
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">Chưa tạo đề thi nào.</td></tr>`;
            document.getElementById("stat-exams").textContent = "0"; 
            return;
        }
        
        let stt = 1;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            tableBody.innerHTML += `
            <tr style="border-bottom: 1px solid #e5e7eb">
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${stt++}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #2563eb;">${data.examCode}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.title}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.duration} phút</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${data.questions ? data.questions.length : 0}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">
                    <button class="btn-delete-exam" data-id="${docSnap.id}" style="background:#ef4444;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Xóa</button>
                </td>
            </tr>`;
        });
        document.getElementById("stat-exams").textContent = stt - 1;
        
        document.querySelectorAll('.btn-delete-exam').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Xóa đề thi này?")) { 
                    await deleteDoc(doc(db, "exams", e.target.getAttribute('data-id'))); 
                    loadExams(); 
                }
            });
        });
    } catch (error) { console.error(error); }
}

// ==========================================
// 4. KHỞI CHẠY & CÁC CHỨC NĂNG KHÁC
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const emailEl = document.getElementById("user-email");
        if (emailEl) emailEl.textContent = user.email;
        loadQuestions(); 
        loadExams(); 
        loadResults();
    } else {
        window.location.href = "teacher-login.html";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.addEventListener("click", () => signOut(auth).catch(console.error));

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
                type: type, 
                level: document.getElementById("q-level").value,
                points: parseFloat(document.getElementById("q-points").value),
                content: CKEDITOR.instances['q-content'].getData(), 
                correct: correctAns, 
                teacherId: currentUser.uid, 
                createdAt: serverTimestamp()
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
                CKEDITOR.instances['q-content'].setData(""); 
                loadQuestions(); alert("Đã lưu câu hỏi!");
            } catch (error) { console.error(error); }
        });
    }

    const btnDownloadSample = document.getElementById("btn-download-sample");
    if (btnDownloadSample) {
        btnDownloadSample.addEventListener("click", () => {
            const sampleContent = `HƯỚNG DẪN TẠO ĐỀ THI TEST PRO (CHUẨN 3 PHẦN CỦA BỘ GD&ĐT)\n(Lưu ý: Giáo viên có thể chèn trực tiếp Hình ảnh, Bảng biểu vào ngay dưới nội dung câu hỏi trong file Word)\n\n--------------------------------------------------\nPHẦN I: CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN\n(Hệ thống tự nhận diện thông qua 4 đáp án A, B, C, D)\n\nCâu 1: Thủ đô của Việt Nam là gì?\nA. Đà Nẵng\nB. Hà Nội\nC. TP. Hồ Chí Minh\nD. Huế\nĐáp án: B\nMức độ: 1\nĐiểm: 0.25\n\n--------------------------------------------------\nPHẦN II: CÂU TRẮC NGHIỆM ĐÚNG/SAI\n(Hệ thống tự nhận diện thông qua chuỗi đáp án có dạng Đ, S, Đ, S. Nếu gõ nhầm thành chữ D tiếng Anh, hệ thống vẫn tự động hiểu là Đ)\n\nCâu 2: Cho các nhận định sau về tự nhiên Việt Nam:\nA. Đường bờ biển nước ta dài 3260 km.\nB. Nước ta có 64 tỉnh thành phố.\nC. Đỉnh Fansipan là đỉnh núi cao nhất Đông Dương.\nD. Sông Thu Bồn nằm ở Đồng bằng sông Hồng.\nĐáp án: Đ, S, Đ, S\nMức độ: 2\nĐiểm: 1\n\n--------------------------------------------------\nPHẦN III: CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (TỰ LUẬN NGẮN)\n(Dành cho các câu tính toán ra số cụ thể hoặc điền từ. BẮT BUỘC dùng cú pháp <key = đáp_án> để hệ thống nhận diện chính xác)\n\nCâu 3: Cho bảng số liệu sau về diện tích và sản lượng lúa:\n[GIÁO VIÊN COPY VÀ DÁN BẢNG SỐ LIỆU TỪ EXCEL/WORD VÀO ĐÂY]\nHãy tính năng suất lúa của vùng Đồng bằng sông Hồng (tạ/ha) và làm tròn kết quả đến số thập phân thứ hai.\nĐáp án: <key = 62.05>\nMức độ: 3\nĐiểm: 0.5`;
            const blob = new Blob(["\ufeff", sampleContent], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `Huong_Dan_De_Mau_Test_Pro.txt`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    }

    const uploadDocx = document.getElementById("upload-docx");
    const bulkInput = document.getElementById("bulk-questions-input");
    const bulkPreview = document.getElementById("bulk-preview");

    if (uploadDocx) {
        uploadDocx.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.docx')) {
                alert("Hệ thống chỉ hỗ trợ file Word định dạng .docx!");
                this.value = ""; return;
            }
            bulkPreview.innerHTML = `<span style="color: #eab308;">⏳ Đang phân tích Bảng và Hình ảnh, vui lòng đợi...</span>`;
            
            const options = {
                convertImage: mammoth.images.imgElement(function(image) {
                    return image.read("base64").then(function(imageBuffer) {
                        return { src: "data:" + image.contentType + ";base64," + imageBuffer };
                    });
                })
            };

            const reader = new FileReader();
            reader.onload = function(loadEvent) {
                const arrayBuffer = loadEvent.target.result;
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options)
                    .then(function(result) {
                        const rawHtml = result.value;
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = rawHtml;
                        parsedBulkQuestions = []; 
                        let currentQ = null;
                        let currentField = null;

                        Array.from(tempDiv.childNodes).forEach(node => {
                            if (node.nodeType !== 1 && node.nodeType !== 3) return; 
                            let text = node.textContent.trim();
                            if (!text && node.nodeType === 3) return;
                            let cauMatch = text.match(/^Câu\s*\d+\s*[:\.\-]\s*(.*)/i);
                            if (cauMatch) {
                                if (currentQ) parsedBulkQuestions.push(currentQ);
                                currentQ = {
                                    content: node.nodeType === 1 ? node.outerHTML : text,
                                    optA: "", optB: "", optC: "", optD: "",
                                    correct: "", level: "1", points: 0.25, type: "", teacherId: currentUser.uid
                                };
                                currentField = 'content';
                                return;
                            }
                            if (!currentQ) return;
                            let optAMatch = text.match(/^A\.\s*(.*)/i);
                            let optBMatch = text.match(/^B\.\s*(.*)/i);
                            let optCMatch = text.match(/^C\.\s*(.*)/i);
                            let optDMatch = text.match(/^D\.\s*(.*)/i);
                            let ansMatch = text.match(/^Đáp án\s*:\s*(.*)/i);
                            let levelMatch = text.match(/^Mức độ\s*:\s*(.*)/i);
                            let pointMatch = text.match(/^Điểm\s*:\s*(.*)/i);

                            if (optAMatch) { currentQ.optA = optAMatch[1].trim(); currentField = 'optA'; }
                            else if (optBMatch) { currentQ.optB = optBMatch[1].trim(); currentField = 'optB'; }
                            else if (optCMatch) { currentQ.optC = optCMatch[1].trim(); currentField = 'optC'; }
                            else if (optDMatch) { currentQ.optD = optDMatch[1].trim(); currentField = 'optD'; }
                            else if (ansMatch) { 
                                let rawAns = ansMatch[1].trim();
                                let keyMatch = rawAns.match(/<key\s*=\s*(.*?)>/i);
                                if (keyMatch) { currentQ.correct = keyMatch[1].trim(); currentQ.type = "SHORT"; } 
                                else {
                                    let upperAns = rawAns.toUpperCase().replace(/\s+/g, '');
                                    let dsMatch = upperAns.match(/^[ĐS],[ĐS],[ĐS],[ĐS]$/); 
                                    if (['A', 'B', 'C', 'D'].includes(upperAns)) { currentQ.correct = upperAns; currentQ.type = "MCQ"; } 
                                    else if (dsMatch) { currentQ.correct = upperAns; currentQ.type = "TF"; } 
                                    else { currentQ.correct = rawAns; currentQ.type = "SHORT"; }
                                }
                                currentField = 'correct'; 
                            }
                            else if (levelMatch) { currentQ.level = levelMatch[1].trim(); currentField = 'level'; }
                            else if (pointMatch) { currentQ.points = parseFloat(pointMatch[1].trim().replace(',', '.')) || 0.25; currentField = 'points'; }
                            else {
                                if (currentField === 'content') { currentQ.content += (node.nodeType === 1 ? node.outerHTML : "<br>" + text); } 
                                else if (currentField) { currentQ[currentField] += " " + text; }
                            }
                        });
                        if (currentQ) parsedBulkQuestions.push(currentQ);
                        parsedBulkQuestions.forEach(q => { if (!q.optA && !q.optB && !q.optC && !q.optD && q.type !== "TF") q.type = "SHORT"; });
                        bulkInput.value = `Đã phân tích thành công ${parsedBulkQuestions.length} câu hỏi.\n(Hỗ trợ trọn vẹn Bảng số liệu và Hình ảnh).\n\nVui lòng bấm nút "XỬ LÝ" để lưu vào máy chủ.`;
                        bulkInput.disabled = true; 
                        bulkPreview.innerHTML = `<span style="color: #10b981;">✔ Nhận diện thành công ${parsedBulkQuestions.length} câu. Sẵn sàng lưu!</span>`;
                        uploadDocx.value = ""; 
                    })
                    .catch(function(error) {
                        console.error(error);
                        bulkPreview.innerHTML = `<span style="color: #ef4444;">❌ Lỗi: Không thể phân tích HTML từ file Word này.</span>`;
                        uploadDocx.value = ""; 
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    const btnProcessBulk = document.getElementById("btn-process-bulk");
    if (btnProcessBulk) {
        btnProcessBulk.addEventListener("click", async () => {
            if (!currentUser) return;
            let questionsToSave = [];
            if (parsedBulkQuestions.length > 0) {
                questionsToSave = parsedBulkQuestions;
            } else {
                const bulkData = bulkInput.value.trim();
                if (!bulkData) return alert("Vui lòng nhập nội dung hoặc tải lên file Word!");
                const rows = bulkData.split('\n'); 
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
                            correct: "", level: "1", points: 0.25, type: "", teacherId: currentUser.uid
                        };
                        currentField = 'content'; continue;
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
                        if (keyMatch) { currentQ.correct = keyMatch[1].trim(); currentQ.type = "SHORT"; } 
                        else {
                            let upperAns = rawAns.toUpperCase().replace(/\s+/g, '');
                            let dsMatch = upperAns.match(/^[ĐS],[ĐS],[ĐS],[ĐS]$/); 
                            if (['A', 'B', 'C', 'D'].includes(upperAns)) { currentQ.correct = upperAns; currentQ.type = "MCQ"; } 
                            else if (dsMatch) { currentQ.correct = upperAns; currentQ.type = "TF"; } 
                            else { currentQ.correct = rawAns; currentQ.type = "SHORT"; }
                        }
                        currentField = 'correct'; 
                    }
                    else if (levelMatch) { currentQ.level = levelMatch[1].trim(); currentField = 'level'; }
                    else if (pointMatch) { currentQ.points = parseFloat(pointMatch[1].trim().replace(',', '.')) || 0.25; currentField = 'points'; }
                    else { if (currentField && currentQ[currentField] !== undefined) currentQ[currentField] += "<br>" + line; }
                }
                if (currentQ) questionsToSave.push(currentQ); 
                questionsToSave.forEach(q => { if (!q.optA && !q.optB && !q.optC && !q.optD) q.type = "SHORT"; });
            }

            if (questionsToSave.length > 0) {
                btnProcessBulk.disabled = true;
                bulkPreview.innerHTML = `<span style="color: #eab308;">Đang lưu ${questionsToSave.length} câu hỏi...</span>`;
                try {
                    const savePromises = questionsToSave.map(q => {
                        q.createdAt = serverTimestamp();
                        return addDoc(collection(db, "questions"), q);
                    });
                    await Promise.all(savePromises);
                    bulkInput.value = ""; 
                    bulkInput.disabled = false; 
                    parsedBulkQuestions = []; 
                    loadQuestions(); 
                    bulkPreview.innerHTML = `<span style="color: #10b981;">✔ Đã nhận diện và lưu thành công ${questionsToSave.length} câu!</span>`;
                } catch(err) {
                    console.error(err);
                    bulkPreview.innerHTML = `<span style="color: #ef4444;">Lỗi khi lưu dữ liệu lên máy chủ!</span>`;
                } finally {
                    btnProcessBulk.disabled = false;
                }
            } else {
                alert("Không nhận diện được câu hỏi nào. Đảm bảo bắt đầu bằng chữ 'Câu 1:'");
            }
        });
    }

    const createExamForm = document.getElementById("create-exam-form");
    if (createExamForm) {
        createExamForm.addEventListener("submit", async (e) => {
            e.preventDefault(); if (!currentUser) return;
            const selected = document.querySelectorAll('input[name="exam-question-cb"]:checked, .cb-q-item-exam:checked');
            if (selected.length === 0) return alert("Chọn ít nhất 1 câu hỏi!");
            const examCode = document.getElementById("exam-code").value.trim().toUpperCase();
            let qsData = []; 
            selected.forEach(cb => { 
                const q = allQuestions.find(i => i.id === cb.value); 
                if(q) qsData.push(q); 
            });
            
            const qCheck = query(collection(db, "exams"), where("examCode", "==", examCode));
            if (!(await getDocs(qCheck)).empty) return alert("Mã đề đã tồn tại!");
            
            await addDoc(collection(db, "exams"), {
                examCode: examCode, title: document.getElementById("exam-title").value.trim(), duration: parseInt(document.getElementById("exam-duration").value),
                questions: qsData, teacherId: currentUser.uid, createdAt: serverTimestamp()
            });
            createExamForm.reset(); loadExams(); alert("Tạo đề thi thành công!");
        });
    }

    const btnExport = document.getElementById("btn-export-csv");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            if (allResults.length === 0) return alert("Chưa có kết quả!");
            let csvContent = "STT,Tên học sinh,Lớp,Mã đề,Tên đề thi,Điểm,Số câu đúng,Thời gian nộp bài\n";
            allResults.forEach((r, i) => {
                const date = r.submittedAt ? r.submittedAt.toDate().toLocaleString('vi-VN') : '';
                const lop = r.studentClass ? r.studentClass : "";
                csvContent += `${i + 1},"${r.studentName}","${lop}","${r.examCode}","${r.examTitle}",${r.score},"${r.correctCount}/${r.totalQuestions}","${date}"\n`;
            });
            const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `Ket_Qua_${new Date().getTime()}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        });
    }

    const cbSelectAllQ = document.getElementById("cb-select-all-q");
    const btnDeleteSelectedQ = document.getElementById("btn-delete-selected-q");
    if (cbSelectAllQ) {
        cbSelectAllQ.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.cb-q-item').forEach(cb => cb.checked = isChecked);
            if (btnDeleteSelectedQ) btnDeleteSelectedQ.style.display = (isChecked && document.querySelectorAll('.cb-q-item').length > 0) ? "block" : "none";
        });
    }
    if (btnDeleteSelectedQ) {
        btnDeleteSelectedQ.addEventListener("click", async () => {
            const checkedBoxes = document.querySelectorAll('.cb-q-item:checked');
            if (checkedBoxes.length === 0) return;
            if(confirm(`Xóa ${checkedBoxes.length} câu hỏi đã chọn?`)) {
                btnDeleteSelectedQ.textContent = "⏳ Đang xóa..."; btnDeleteSelectedQ.disabled = true;
                try {
                    await Promise.all(Array.from(checkedBoxes).map(cb => deleteDoc(doc(db, "questions", cb.value))));
                    alert(`Đã xóa thành công!`);
                } catch (err) { console.error(err); } 
                finally { btnDeleteSelectedQ.textContent = "🗑 Xóa các câu đã chọn"; btnDeleteSelectedQ.disabled = false; loadQuestions(); }
            }
        });
    }

    const cbSelectAllR = document.getElementById("cb-select-all-r");
    const btnDeleteSelectedR = document.getElementById("btn-delete-selected-r");
    if (cbSelectAllR) {
        cbSelectAllR.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.cb-r-item').forEach(cb => cb.checked = isChecked);
            if (btnDeleteSelectedR) btnDeleteSelectedR.style.display = (isChecked && document.querySelectorAll('.cb-r-item').length > 0) ? "inline-block" : "none";
        });
    }
    if (btnDeleteSelectedR) {
        btnDeleteSelectedR.addEventListener("click", async () => {
            const checkedBoxes = document.querySelectorAll('.cb-r-item:checked');
            if (checkedBoxes.length === 0) return;
            if(confirm(`Xóa ${checkedBoxes.length} kết quả đã chọn?`)) {
                btnDeleteSelectedR.textContent = "⏳ Đang xóa..."; btnDeleteSelectedR.disabled = true;
                try {
                    await Promise.all(Array.from(checkedBoxes).map(cb => deleteDoc(doc(db, "results", cb.value))));
                    alert(`Đã xóa thành công!`);
                } catch (err) { console.error(err); } 
                finally { btnDeleteSelectedR.textContent = "🗑 Xóa các bài đã chọn"; btnDeleteSelectedR.disabled = false; loadResults(); }
            }
        });
    }
});