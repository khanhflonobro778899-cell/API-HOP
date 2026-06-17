const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo các biến lưu trữ dữ liệu trong bộ nhớ tạm
let totalExecute = 0;
let moonServers = new Map(); // Dùng Map để tự động ghi đè/cập nhật nếu trùng JobId

// Endpoint tiếp nhận dữ liệu từ Roblox Script gửi lên
app.post('/update-moon', (req, res) => {
    const { jobid, players } = req.body;
    
    if (!jobid) {
        return res.status(400).send("Thiếu JobId");
    }

    totalExecute++; // Tăng tổng số lần thực thi thành công

    // Lưu hoặc cập nhật thông tin server vào danh sách
    moonServers.set(jobid, {
        "Players": players || 1,
        "jobid": jobid,
        "name": "Full Moon",
        "updatedAt": Date.now() // Timestamp thời gian thực của năm 2026
    });

    res.status(200).send("Cập nhật thành công!");
});

// Cơ chế dọn rác: Tự động xóa server khỏi danh sách sau 15 phút nếu không thấy cập nhật lại (Tránh giữ server đã sập)
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of moonServers.entries()) {
        if (now - data.updatedAt > 15 * 60 * 1000) { 
            moonServers.delete(jobid);
        }
    }
}, 60000); // Quét dọn mỗi phút một lần

// Giao diện hiển thị trực quan (Khớp chính xác giao diện trong ảnh của bạn)
app.get('/', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    
    const finalData = {
        "Total Execute": totalExecute,
        "by": "tungdepzai", // Thay tên bạn ở đây nha!
        "total_moon_servers": moonDataArray.length,
        "moon_data": moonDataArray
    };

    // Trả về HTML giao diện text/json có nút bấm toggle format
    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Moon Server Tracker</title>
        <style>
            body {
                background-color: #121212;
                color: #e0e0e0;
                font-family: monospace;
                padding: 15px;
                margin: 0;
            }
            .controls {
                margin-bottom: 10px;
                font-size: 14px;
                user-select: none;
            }
            pre {
                background-color: #181818;
                padding: 10px;
                border-radius: 4px;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 13px;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="controls">
            <label>
                <input type="checkbox" id="prettyPrint" checked onchange="renderJSON()"> Tạo bản in đẹp
            </label>
        </div>
        <pre id="jsonContent"></pre>

        <script>
            const rawData = ${JSON.stringify(finalData)};
            
            function renderJSON() {
                const isPretty = document.getElementById('prettyPrint').checked;
                const container = document.getElementById('jsonContent');
                if (isPretty) {
                    container.textContent = JSON.stringify(rawData, null, 2);
                } else {
                    container.textContent = JSON.stringify(rawData);
                }
            }
            
            // Chạy render lần đầu
            renderJSON();

            // Tự động tải lại trang sau mỗi 8 giây để cập nhật danh sách server mới nhất
            setTimeout(() => {
                location.reload();
            }, 8000);
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Web đang chạy tại port ${PORT}`);
});
            
