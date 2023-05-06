// Imports
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

// Constants
const PORT = 3001;
const URL = `http://localhost:${PORT}`;
const CLIENT_PORT = 3000;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;
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
  "room1": {roundCards: [], players: []},
  "room2": {roundCards: [], players: []},
  "room3": {roundCards: [], players: []}
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

const serversListClientsNumber = () => {
    Object.keys(roomData).forEach((room) => {
    const roomClients = io.sockets.adapter.rooms.get(room);
    if(roomClients) roomData[room].numPlayers = roomClients.size;
    else roomData[room].numPlayers = 0;
  });
}

io.on("connection", (socket) => {
  // Get Servers List
  socket.on('serversRequest', () => {
    serversListClientsNumber();
    socket.emit('serversResponse', { servers: roomData });
  });

  // When a player joins a room
  socket.on("joinRoom", (data) => {
    socket.join(data.room);

    // Update the number of players in the room
    serversListClientsNumber();
    io.emit('serversResponse', { servers: roomData });

    // room cilents possibles
    const roomClients = io.sockets.adapter.rooms.get(data.room).size;
    if(roomClients === 1)
    {
      // Delete old data
      roomData[data.room].roundCards = [];
      roomData[data.room].players = [];
      socket.emit('joinedRoom', 'Waiting for other player to join');
    }
    else if(roomClients === PLAYERS_IN_GAME  ) {
      // iterate over all the sockets in the room and send them the cards
      io.in(data.room).fetchSockets().then((sockets) => {
        sockets.forEach((socket) => {
          socket.emit("gameStart", { cards: generateCards() });
        });
      });
    }

    // Add the player to the room
    roomData[data.room].players.push({player_id: data.playerId, player_score: 0, playerName: data.playerName});
  });

  socket.on("cardPlayed", (data) => {
    if(data.card != 'back.png')
    {
      roomData[data.room].roundCards.push({[data.playerId]: data.card});
    }

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
    
      roomData[data.room].players.forEach((player) => {
        if(player.player_id == winner)
        {
          player.player_score++;
        }
      });

      // Emit the round result to all players in the room
      io.to(data.room).emit("roundResult", {winner: winner});

      // Clear the round cards array for the current room
      roomData[data.room].roundCards = [];
    }
  });

  socket.on('gameEnd', (data) => {
    let max_score = 0;
    let winner = "";
    let winner_username = "";
    let scores = [];
    roomData[data.room].players.forEach((player) => {
      scores.push(player.player_score);
      if(player.player_score > max_score)
      {
        max_score = player.player_score;
        winner = player.player_id;
        winner_username = player.playerName;
      }
    });

    // If both players have the same score, it's a draw
    if((scores.length > 1 && (scores[0] == scores[1])) || winner == "")
    {
      winner = "draw";
    }
    socket.emit("gameEndResponse", {winner: winner, winner_username: winner_username});

    // Clear the players array for the current room
    serversListClientsNumber();
    socket.emit('serversResponse', { servers: roomData });
  })

  socket.on("disconnect", () => {
    Object.keys(roomData).forEach((room) => {
      const roomClients = io.sockets.adapter.rooms.get(room);
      if(roomClients) roomData[room].numPlayers = roomClients.size;
      else roomData[room].numPlayers = 0;
    });
    io.emit('serversResponse', { servers: roomData });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running via port ${PORT}`);
});
