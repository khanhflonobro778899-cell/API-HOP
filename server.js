const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo các biến lưu trữ dữ liệu trong bộ nhớ tạm
let totalExecute = 0;
let moonServers = new Map(); // Dùng Map để tự động ghi đè/cập nhật nếu trùng JobId

// 1. Cổng tiếp nhận dữ liệu từ Roblox Tracker Script gửi lên
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
        "updatedAt": Date.now()
    });

    res.status(200).send("Cập nhật thành công!");
});

// 2. Cổng dành riêng cho Script Lua lấy dữ liệu về để Auto Hop Server
app.get('/api', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    res.json({
        "moon_data": moonDataArray
    });
});

// Cơ chế tự động xóa server khỏi danh sách sau 15 phút nếu không thấy cập nhật lại (Tránh server ảo/sập)
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of moonServers.entries()) {
        if (now - data.updatedAt > 15 * 60 * 1000) { 
            moonServers.delete(jobid);
        }
    }
}, 60000); // Quét dọn bộ nhớ mỗi phút một lần

// 3. Giao diện hiển thị trực quan (Nền tối + Nút toggle định dạng)
app.get('/', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    
    const finalData = {
        "Total Execute": totalExecute,
        "by": "tranduykhanh",
        "total_moon_servers": moonDataArray.length,
        "moon_data": moonDataArray
    };

    // Trả về mã nguồn HTML giao diện trực quan cho trình duyệt
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
            
            // Chạy kết xuất dữ liệu lần đầu
            renderJSON();

            // Tự động làm mới trang sau mỗi 8 giây để cập nhật server mới nhất
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
