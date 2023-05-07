// Imports
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import accountRoute from './controllers/account.js';
import mongoose from "mongoose";

import dotenv from 'dotenv';
dotenv.config();

// Constants
const PORT = 3001;
const URL = `http://localhost:${PORT}`;
const CLIENT_PORT = 3000;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;
const PLAYERS_IN_GAME = 2;

// Server setup
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const mongo_url = process.env.MONGO_URL;

//Account
app.use('/api/account', accountRoute);

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
  const cards = [];
  for (let i = 1; i <= 13; i++) {
    cards.push(i + "S.png");
    cards.push(i + "C.png");
    cards.push(i + "D.png");
    cards.push(i + "H.png");
  }
  
  // Shuffle the array of cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
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
      let cardsStack = generateCards();
      // Split the cards stack into two halves and send each player one half
      let splittedCards = [cardsStack.splice(0, cardsStack.length / 2), cardsStack];

      // iterate over all the sockets in the room and send them the cards
      io.in(data.room).fetchSockets().then((sockets) => {
        sockets.forEach((socket) => {
          socket.emit("gameStart", { cards: splittedCards[sockets.indexOf(socket)] });
          roomData[data.room].players[sockets.indexOf(socket)].player_cards = splittedCards[sockets.indexOf(socket)];
        });
      });
    }

    // Add the player to the room
    roomData[data.room].players.push({player_id: data.playerId, player_cards: [], playerName: data.playerName});
  });

  socket.on("cardPlayed", (data) => {
    // remove starting card
    roomData[data.room].players.forEach((player) => {
      if(player.player_id == data.playerId)
      {
        player.player_cards.shift();
      }
    });

    // Add the played card to the round cards
    if(data.card != 'back.png')
    {
      roomData[data.room].roundCards.push({playerId: data.playerId, card: data.card});
    }
    else 
    {
      // add to the end of the array the dropped card
      roomData[data.room].players.forEach((player) => {
        if(player.player_id == data.playerId)
        {
          player.player_cards.push(data.card);
        }
      });
    }

    // Anyway update the otherside player with dropped played card
    socket.to(data.room).emit("OtherPlayerCard", data);

    // If both players have played a card, determine the winner of the round
    if(roomData[data.room].roundCards.length === PLAYERS_IN_GAME) {
      const cards = roomData[data.room].roundCards;

      const card1 = [cards[0].card.match(/\d+/g), cards[0].card, cards[0].playerId];
      const card2 = [cards[1].card.match(/\d+/g), cards[1].card, cards[1].playerId];
      let winner;

      if (card1[0] > card2[0]) {
        winner = card1[2];
      } else if (card2[0] > card1[0]) {
        winner = card2[2];
      } else {
        winner = "draw";
      }
      
      if(winner == "draw")
      {
        // every player will get his card back in server
        roomData[data.room].players.forEach((player) => {
          if(player.player_id == card1[2])
          {
            player.player_cards.push(card1[1]);
          }
          else
          {
            player.player_cards.push(card2[1]);
          }
        });

        // every player will get his card back in client
        io.to(data.room).emit("roundResult", {
          winner: winner,
          cardsToAddToWinner: 
          [
            {playerId: card1[2], card: card1[1]}, 
            {playerId: card2[2], card: card2[1]}
          ]});
      }
      else
      {
        // update the winner with the two cards on server
        roomData[data.room].players.forEach((player) => {
          if(player.player_id == winner)
          {
            player.player_cards.push(card1[1]);
            player.player_cards.push(card2[1]);
          }
        });

        // update the winner with the two cards on client
        io.to(data.room).emit("roundResult", {
          winner: winner,
          cardsToAddToWinner:
          [
            {playerId: card1[2], card: card1[1]},
            {playerId: card2[2], card: card2[1]}
          ]}
        );
      }

      // Clear the round cards array for the current room
      roomData[data.room].roundCards = [];
    }

    console.log("--------------------------------------------");
    roomData[data.room].players.forEach((player) => {
      console.log("Player " + player.player_id + " cards: " + player.player_cards.length)
    });
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

mongoose.set({'strictQuery':false});
mongoose.connect(mongo_url)
.then(results => {
    app.listen(PORT+1, function(){
        console.log(`Server is running via port ${PORT+1}`);
    })
    server.listen(PORT, function(){
      console.log(`Sockets Server is running via port ${PORT}`);
    })
})
.catch(error => {
    console.log(error);
})
