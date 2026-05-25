const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// 🧠 oda şifreleri
const rooms = {
    kartel: "1234",
    genel: "0000"
};

io.on("connection", (socket) => {

    console.log("Bağlandı");

    // 🚪 oda giriş
    socket.on("joinRoom", ({ name, room, password }) => {

        if (rooms[room] !== password) {
            socket.emit("errorMessage", "Şifre yanlış!");
            return;
        }

        socket.join(room);
        socket.room = room;
        socket.name = name;

        socket.emit("chatHistory"); // client-side sade

        io.to(room).emit("system", `${name} katıldı`);
    });

    // 💬 mesaj
    socket.on("message", (data) => {
        if (!socket.room) return;

        io.to(socket.room).emit("message", {
            name: socket.name,
            msg: data
        });
    });

    // ✍️ typing
    socket.on("typing", () => {
        if (!socket.room) return;
        socket.to(socket.room).emit("typing", socket.name);
    });

    // 🎤 voice (WebRTC signal)
    socket.on("signal", (data) => {
        if (!socket.room) return;
        socket.to(socket.room).emit("signal", {
            name: socket.name,
            data
        });
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
