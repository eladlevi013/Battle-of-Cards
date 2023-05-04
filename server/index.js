import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

// Server setup
const app = express();
const server = http.createServer(app);

// Initialize a new instance of Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://192.168.1.16:3000',
    methods: ["GET", "POST"]
  }
});

// Use the CORS middleware
app.use(cors());

// Store player counts and round cards in an object
const roomData = {
  "room1": {roundCards: []},
  "room2": {roundCards: []},
  "room3": {roundCards: []},
};

io.on("connection", (socket) => {
    socket.on("joinRoom", (room) => {
        socket.join(room);
        const roomClients = io.sockets.adapter.rooms.get(room).size;
        const playerName = 'player' + roomClients;
        socket.emit('joinedRoom', { playerName });
        console.log(roomClients + " clients in " + room);
      
        if(roomClients === 2) {
          // iterate over all the sockets in the room and send them the cards
          io.in(room).fetchSockets().then((sockets) => {
            sockets.forEach((socket) => {
            // generate an array of 20 cards with random number between 1-13 and random letters C D H OR S
            const suits = ['C', 'D', 'H', 'S'];
            const cards = [];
            for (let i = 0; i < 20; i++) {
                const number = Math.floor(Math.random() * 13) + 1;
                const suitIndex = Math.floor(Math.random() * 4);
                const suit = suits[suitIndex];
                const card = `${number}${suit}.png`;
                cards.push(card);
            }
              socket.emit("giveCards", { cards });
            });
          });
        }
      });      

      socket.on("cardPlayed", (data) => {
        // Add the played card to the round cards array for the current room and player
        roomData[data.room].roundCards.push({[data.playerName]: data.card});
        console.log(roomData);
    
        // Emit the played card to the other player in the room
        socket.to(data.room).emit("OtherPlayerCard", data);
    
        // If both players have played a card, determine the winner of the round
        if(roomData[data.room].roundCards.length === 2) {
            const cards = roomData[data.room].roundCards;
            const card1 = parseInt(cards[0][Object.keys(cards[0])[0]].substring(0, cards[0][Object.keys(cards[0])[0]].length - 5));
            const card2 = parseInt(cards[1][Object.keys(cards[1])[0]].substring(0, cards[1][Object.keys(cards[1])[0]].length - 5));
    
            let winner;
            if (card1 > card2) {
                winner = Object.keys(cards[0])[0];
            } else if (card2 > card1) {
                winner = Object.keys(cards[1])[0];
            } else {
                winner = "draw";
            }            
    
            // Emit the round result to all players in the room
            io.to(data.room).emit("roundResult", {winner: winner});
            
            console.log('muzar');

            // Clear the round cards array for the current room
            roomData[data.room].roundCards = [];
        }
    });    
});

server.listen(3001, () => {
  console.log("Server is running via port 3001");
});
