const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 📁 frontend dosyaları
app.use(express.static("public"));

// 💬 bağlantı
io.on("connection", (socket) => {

    console.log("Bir kullanıcı bağlandı");

    // 💬 mesaj alma ve herkese gönderme
    socket.on("message", (data) => {
        io.emit("message", {
            name: data.name || "Anonim",
            msg: data.msg
        });
    });

    // ❌ bağlantı kopma
    socket.on("disconnect", () => {
        console.log("Bir kullanıcı çıktı");
    });
});

// ⚡ Railway PORT (ÇOK ÖNEMLİ)
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server çalışıyor port:", PORT);
});
