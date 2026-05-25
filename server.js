const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {};   // socket.id -> user
const rooms = {};   // room -> {password}

function getRoomUsers(room){
    let list = [];
    for(let id in users){
        if(users[id].room === room){
            list.push(users[id].username);
        }
    }
    return list;
}

io.on("connection", (socket) => {

    // 👤 LOGIN
    socket.on("login", (username) => {

        users[socket.id] = {
            username,
            room: null
        };

        socket.emit("loggedIn", username);
    });

    // 🌍 GLOBAL
    socket.on("joinGlobal", () => {

        const user = users[socket.id];
        if(!user) return;

        socket.join("global");
        user.room = "global";

        io.to("global").emit("system", {
            text: `${user.username} globale girdi`
        });

        io.to("global").emit("onlineUsers", getRoomUsers("global"));
    });

    // ➕ ODA OLUŞTUR
    socket.on("createRoom", ({ room, password }) => {

        if(rooms[room]){
            socket.emit("errorMessage", "Oda zaten var!");
            return;
        }

        rooms[room] = { password };

        socket.emit("roomCreated", room);
    });

    // 🚪 ODAYA GİR
    socket.on("joinRoom", ({ room, password }) => {

        const user = users[socket.id];
        if(!user) return;

        if(!rooms[room]){
            socket.emit("errorMessage", "Oda yok!");
            return;
        }

        if(rooms[room].password !== password){
            socket.emit("errorMessage", "Şifre yanlış!");
            return;
        }

        socket.join(room);
        user.room = room;

        io.to(room).emit("system", {
            text: `${user.username} odaya girdi`
        });

        io.to(room).emit("onlineUsers", getRoomUsers(room));
    });

    // 💬 MESAJ
    socket.on("message", (msg) => {

        const user = users[socket.id];
        if(!user || !user.room) return;

        io.to(user.room).emit("message", {
            name: user.username,
            msg
        });
    });

    // ✍️ typing
    socket.on("typing", () => {

        const user = users[socket.id];
        if(!user || !user.room) return;

        socket.to(user.room).emit("typing", user.username);
    });

    // 🎤 voice signal
    socket.on("signal", (data) => {

        const user = users[socket.id];
        if(!user || user.room === "global") return;

        socket.to(user.room).emit("signal", data);
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server çalışıyor");
});
