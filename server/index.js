import express from 'express';
const app = express();
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

app.use(cors())

const server = http.createServer(app);

const playerCounter = 
{
    "room1": 0,
    "room2": 0,
    "room3": 0,
}

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    socket.on("send_message", (data) => {
        console.log(data.selectedCard + "Asdasd");
        if (data.selectedCard !== undefined) {
            socket.to(data.selectedWorld.worldName).emit("get_message", data.selectedCard)
        }
        else 
            console.log("asdasdasd");
    });

    socket.on("start_game", (data) => {
        const clients = io.sockets.adapter.rooms.get("room1");
        
        clients.forEach((socketId) => {
            const length = 20;
            const numbers = Array.from({ length }, () => Math.floor(Math.random() * 10) + 1);
            const result = numbers.map((num) => `${num}C.png`);
            
            io.to(socketId).emit('start_game_feedback', result);
          });
    })

    socket.on("join_world", (data) => {
        if(data != undefined)
        {
            if(playerCounter[data.worldName] == 1)
            {
                socket.emit("join_world_feedback", "game starting!");
                playerCounter[data.worldName]++;
                console.log(playerCounter);
                socket.join(data.worldName);
            }
            else if(playerCounter[data.worldName] == 2)
            {
                socket.emit("join_world_feedback", "room is full, could not connect the room!");
            }
            else 
            {
                playerCounter[data.worldName]++;
                console.log(playerCounter);
                socket.join(data.worldName);
                socket.emit("join_world_feedback", data.worldName + ", waiting for another player");
            }
        }
    });

    socket.on("leave_world", (data) => {
        socket.leave(data);

        if(playerCounter[data.worldName] > 0)
        {
            socket.emit("join_world_feedback", "room is full, could not connect the room!");
            playerCounter[data.worldName]--;
        }
    });
})

server.listen(3001, () => {
    console.log("Server is running via port 3001");
})
