import express from 'express';
const app = express();
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { Console } from 'console';

// socket.io setup
app.use(cors())
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"]
    }
});

// room player counter
const playerCounter = {
    "room1": 0,
    "room2": 0,
    "room3": 0,
}

io.on("connection", (socket) => {
    // called when player dropped a card and sends the card to other player
    socket.on("dropped_card", (data, excludedId) => {
        console.log(`card dropped by player ${socket.id}: ${data.selectedCard} in room: ${data.selectedRoom}`);
        const roomSockets = io.sockets.in(data.selectedRoom).sockets;
        if (roomSockets) {
          Object.values(roomSockets).forEach((client) => {
            if (client.id !== excludedId) {
              client.emit("other_player_dropped_card", data.selectedCard);
            }
          });
        } else {
          console.log(`Socket room ${data.selectedRoom} not found.`);
        }
      });
      

    // called when game starts and sends cards to players
    socket.on("start_game", (data) => {
        const clients = io.sockets.adapter.rooms.get("room1");
        
        if(clients != undefined)
        {
            clients.forEach((socketId) => {
                const length = 20;
                const numbers = Array.from({ length }, () => Math.floor(Math.random() * 10) + 1);
                const result = numbers.map((num) => `${num}C.png`);
                
                io.to(socketId).emit('starting_cards', result);
            });
        }
    })

    // called when a player joins a room
    socket.on("join_room", (data) => {
        if(data != undefined)
        {
            if(playerCounter[data.selectedRoom] == 1)
            {
                socket.emit("join_room_status", "game starting!");
                playerCounter[data.selectedRoom]++;
                socket.join(data.selectedRoom);
            }
            else if(playerCounter[data.selectedRoom] == 2)
            {
                socket.emit("join_room_status", "room is full, could not connect the room!");
            }
            else 
            {
                playerCounter[data.selectedRoom]++;
                socket.join(data.selectedRoom);
                socket.emit("join_room_status", data.selectedRoom + ", waiting for another player");
            }
        }
    });

    // called when a player leaves a room
    socket.on("leave_room", (data) => {
        socket.leave(data);
        if(playerCounter[data.selectedRoom] > 0)
        {
            playerCounter[data.selectedRoom]--;
        }
        console.log(playerCounter);
    });
})

server.listen(3001, () => {
    console.log("Server is running via port 3001");
})
