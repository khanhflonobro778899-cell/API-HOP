const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Khởi tạo các biến lưu trữ
let totalExecute = 0;
let moonServers = new Map(); 

// ĐÂY LÀ ID CỦA BLOX FRUITS SEA 3
const SEA_3_PLACE_ID = "7449423635";

// 1. Cổng tiếp nhận dữ liệu từ Roblox Tracker Script gửi lên
app.post('/update-moon', (req, res) => {
    // Yêu cầu script tracker gửi lên cả jobId và placeId
    const { jobid, players, placeId } = req.body;
    
    if (!jobid) {
        return res.status(400).send("Thiếu JobId");
    }

    // BỘ LỌC SEA 3: Nếu placeId gửi lên không phải Sea 3 thì bỏ qua ngay lập tức
    if (String(placeId) !== SEA_3_PLACE_ID) {
        return res.status(403).send("Từ chối: Server này không phải Sea 3!");
    }

    totalExecute++; 

    // Lưu chuẩn cấu trúc placeId và jobId để code Lua Auto Hop đọc mượt nhất
    moonServers.set(jobid, {
        "placeId": Number(SEA_3_PLACE_ID),
        "jobId": jobid,
        "players": players || 1,
        "name": "Full Moon Sea 3",
        "updatedAt": Date.now()
    });

    res.status(200).send("Cập nhật thành công Server Sea 3!");
});

// 2. Cổng dành riêng cho Script Lua lấy dữ liệu về để Auto Hop
app.get('/api', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    // Trả thẳng về dạng Array (Danh sách) để khớp hoàn hảo với script Lua
    res.json(moonDataArray);
});

// Cơ chế tự động xóa server khỏi danh sách sau 15 phút (Quét dọn mỗi 1 phút)
setInterval(() => {
    const now = Date.now();
    for (let [jobid, data] of moonServers.entries()) {
        if (now - data.updatedAt > 15 * 60 * 1000) { 
            moonServers.delete(jobid);
        }
    }
}, 60000); 

// 3. Giao diện hiển thị trực quan cho Trình duyệt
app.get('/', (req, res) => {
    const moonDataArray = Array.from(moonServers.values());
    
    const finalData = {
        "Total Execute": totalExecute,
        "by": "tranduykhanh",
        "sea_filter": "Only Sea 3 (7449423635)",
        "total_moon_servers": moonDataArray.length,
        "moon_data": moonDataArray
    };

    res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Moon Server Tracker - Sea 3</title>
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
            
            renderJSON();

            // Tự động làm mới trang sau mỗi 8 giây
            setTimeout(() => {
                location.reload();
            }, 8000);
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Web đang chạy tại port ${PORT} - Chỉ nhận Sea 3`);
});
