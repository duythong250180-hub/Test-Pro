// File: table-renderer.js
// Nhiệm vụ: Xử lý và vẽ bảng danh sách câu hỏi đã được sắp xếp chuẩn 3 phần

export function renderSortedQuestionTable(questions, tbodyElement) {
    // 1. Nếu không có câu hỏi, hiển thị thông báo trống
    if (!questions || questions.length === 0) {
        tbodyElement.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Chưa có dữ liệu câu hỏi.</td></tr>";
        return;
    }

    // 2. Sắp xếp câu hỏi theo thứ tự Phần I, II, III
    const typeOrder = { 'MCQ': 1, 'TF': 2, 'SHORT': 3 };
    
    // Dùng slice() để tạo bản sao, giúp không xáo trộn mảng dữ liệu gốc lưu trên Firebase
    const sortedQuestions = questions.slice().sort((a, b) => {
        const orderA = typeOrder[a.type] || 4;
        const orderB = typeOrder[b.type] || 4;
        return orderA - orderB;
    });

    // 3. Bộ lọc: Tự động xóa chữ "Câu X:" thừa trong nội dung gốc
    const cleanContent = (content) => {
        if (!content) return "";
        return content.replace(/^(<[^>]+>)?\s*Câu\s*\d+\s*[:\.\-]?\s*/i, '$1');
    };

    // 4. Tạo mã HTML cho từng hàng (<tr>) trong bảng
    let html = "";
    sortedQuestions.forEach((q) => {
        let partName = "";
        if (q.type === 'MCQ') partName = "Phần I";
        else if (q.type === 'TF') partName = "Phần II";
        else if (q.type === 'SHORT') partName = "Phần III";
        else partName = "Khác";

        html += `
        <tr>
            <td style="font-weight:bold; color:#2563eb; text-align:center;">${partName}</td>
            <td>${cleanContent(q.content)}</td>
            <td style="text-align:center; font-weight:bold; color:#10b981;">${q.correct}</td>
            <td style="text-align:center;">Mức ${q.level || 1}</td>
            <td style="text-align:center; color:#ef4444;">${q.points || 0.25}</td>
        </tr>`;
    });

    // 5. Đổ dữ liệu đã xử lý vào khung bảng trên màn hình
    tbodyElement.innerHTML = html;
}