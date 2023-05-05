// Imports
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

// Constants
const PORT = 3001;
const URL = `http://10.100.102.24:${PORT}`;
const CLIENT_PORT = 3000;
const CLIENT_URL = `http://10.100.102.24:${CLIENT_PORT}`;
const PLAYERS_IN_GAME = 2;

// Server setup
const app = express();
const server = http.createServer(app);
// Initialize a new instance of Socket.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
}); 
app.use(cors()); // Use the CORS middleware

// Store dropped cards for each room
const roomData = {
  "room1": {roundCards: []},
  "room2": {roundCards: []},
  "room3": {roundCards: []},
};

// Generate random cards for each player
const generateCards = () => {
  const suits = ['C', 'D', 'H', 'S'];
  const cards = [];
  for (let i = 0; i < 20; i++) {
    const number = Math.floor(Math.random() * 13) + 1;
    const suitIndex = Math.floor(Math.random() * 4);
    const suit = suits[suitIndex];
    const card = `${number}${suit}.png`;
    cards.push(card);
  }
  return cards;
}

io.on("connection", (socket) => {
  // When a player joins a room
  socket.on("joinRoom", (room) => {
    socket.join(room);

    const roomClients = io.sockets.adapter.rooms.get(room).size;
    const playerName = 'player' + roomClients;
    socket.emit('joinedRoom', { playerName });
    
    if(roomClients === PLAYERS_IN_GAME  ) {
      // iterate over all the sockets in the room and send them the cards
      io.in(room).fetchSockets().then((sockets) => {
        sockets.forEach((socket) => {
          socket.emit("gameStart", { cards: generateCards() });
        });
      });
    }
    else 
    {
      roomData[room].roundCards = [];
    }
  });

  socket.on("cardPlayed", (data) => {
    // Add the played card to the round cards array for the current room and player
    roomData[data.room].roundCards.push({[data.playerName]: data.card});
    console.log(roomData);
    
    // Emit the played card to the other player in the room
    socket.to(data.room).emit("OtherPlayerCard", data);
    
    // If both players have played a card, determine the winner of the round
    if(roomData[data.room].roundCards.length === PLAYERS_IN_GAME) {
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

      // Clear the round cards array for the current room
      roomData[data.room].roundCards = [];
    }
  });    
});

server.listen(PORT, () => {
  console.log(`Server is running via port ${PORT}`);
});
