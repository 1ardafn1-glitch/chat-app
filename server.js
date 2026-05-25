// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {

    // 🌍 GLOBAL
    socket.on("joinGlobal", (name) => {

        socket.join("global");

        socket.name = name;
        socket.room = "global";

        io.to("global").emit("system", {
            room: "global",
            text: `${name} global sohbete katıldı`
        });
    });

    // ➕ ODA OLUŞTUR
    socket.on("createRoom", ({ name, room, password }) => {

        if (rooms[room]) {
            socket.emit("errorMessage", "Oda zaten var!");
            return;
        }

        rooms[room] = {
            password
        };

        socket.join(room);

        socket.name = name;
        socket.room = room;

        socket.emit("roomCreated", room);

        io.to(room).emit("system", {
            room,
            text: `${name} odayı oluşturdu`
        });
    });

    // 🚪 ODAYA KATIL
    socket.on("joinRoom", ({ name, room, password }) => {

        if (!rooms[room]) {
            socket.emit("errorMessage", "Oda bulunamadı!");
            return;
        }

        if (rooms[room].password !== password) {
            socket.emit("errorMessage", "Şifre yanlış!");
            return;
        }

        socket.join(room);

        socket.name = name;
        socket.room = room;

        io.to(room).emit("system", {
            room,
            text: `${name} odaya katıldı`
        });
    });

    // 💬 MESAJ
    socket.on("message", (msg) => {

        if (!socket.room) return;

        io.to(socket.room).emit("message", {
            name: socket.name,
            msg
        });
    });

    // ✍️ YAZIYOR
    socket.on("typing", () => {

        if (!socket.room) return;

        socket.to(socket.room)
            .emit("typing", socket.name);
    });

    // 🎤 VOICE SIGNAL
    socket.on("signal", (data) => {

        if (!socket.room) return;

        // sadece odalarda voice
        if (socket.room === "global") return;

        socket.to(socket.room).emit("signal", {
            name: socket.name,
            data
        });
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server çalışıyor");
});
