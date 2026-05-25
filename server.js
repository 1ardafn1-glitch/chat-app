const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {

    console.log("Kullanıcı bağlandı");

    // 💬 mesaj
    socket.on("message", (data) => {
        io.emit("message", {
            name: data.name,
            msg: data.msg
        });
    });

    // ✍️ yazıyor
    socket.on("typing", (name) => {
        socket.broadcast.emit("typing", name);
    });

    socket.on("disconnect", () => {
        console.log("Kullanıcı çıktı");
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server çalışıyor:", PORT);
});
