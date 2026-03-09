// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 讓 Express 提供 public 資料夾裡的網頁檔案
app.use(express.static(path.join(__dirname, 'public')));

// 記憶體：儲存最後一次收到的機械臂狀態，讓剛打開網頁的人也能馬上看到！
let latestState = {
    status: "OFFLINE",
    total: 0,
    topology: []
};

wss.on('connection', (ws) => {
    console.log('🎉 一個新裝置連線了！');
    
    // 一連線就先給他最新的狀態
    ws.send(JSON.stringify(latestState));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // 如果收到的資料裡面有 status，代表是 ESP32 主控板傳來的狀態更新！
            if (data.status) {
                latestState = data; // 更新記憶體
                
                // 📡 廣播給其他所有連線的裝置 (手機、電腦)
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(latestState));
                    }
                });
            }
        } catch (e) {
            console.error('⚠️ JSON 解析失敗:', message.toString());
        }
    });

    ws.on('close', () => console.log('👋 裝置斷線了'));
});

// Render 會自動分配 PORT，我們在本地端測試時預設用 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 伺服器順利啟動在 Port ${PORT} 囉！`);
});