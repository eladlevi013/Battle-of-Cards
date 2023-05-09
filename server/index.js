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
const URL = `https://warcardgameserver.onrender.com`;
const CLIENT_PORT = 3000;
const CLIENT_URL = `https://cardgameclient-acd71.web.app/`;
const PLAYERS_IN_GAME = 2;

// Server setup
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const mongo_url = 'mongodb+srv://eladlevi013:1313@cardgame.fpefrua.mongodb.net/?retryWrites=true&w=majority';

//Account
app.use('/api/account', accountRoute);

const server = http.createServer(app);
// Initialize a new instance of Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use(cors()); // Use the CORS middleware

// Store dropped cards for each room
const roomData = {
  "room1": {roundCards: [], players: [], battleCards: [], battle: false, battlRemain: 0},
  "room2": {roundCards: [], players: [], battleCards: [], battle: false, battlRemain: 0},
  "room3": {roundCards: [], players: [], battleCards: [], battle: false, battlRemain: 0},
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
  
  // // remove from production
  // for(let i = 1; i <= 10; i++)
  // {
  //   cards.push("1S.png");
  // }
  
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
    else if(roomClients === PLAYERS_IN_GAME) {
      let cardsStack = generateCards();
      // Split the cards stack into two halves and send each player one half
      let splittedCards = [cardsStack.splice(0, cardsStack.length / 2), cardsStack];

      // iterate over all the sockets in the room and send them the cards
      io.in(data.room).fetchSockets().then((sockets) => {
        sockets.forEach((socket) => {
          socket.emit("gameStart", { cards: splittedCards[sockets.indexOf(socket)] });
          roomData[data.room].players[sockets.indexOf(socket)].player_cards = splittedCards[sockets.indexOf(socket)];
          // console.log(roomData[data.room].players[sockets.indexOf(socket)].player_cards);
        });
      });
    }

    // Add the player to the room
    roomData[data.room].players.push({player_id: data.playerId, player_cards: [], playerName: data.playerName});
  });

  socket.on("cardPlayed", (data) => {
    // Update the round cards data
    roomData[data.room].roundCards.push({playerId: data.playerId, card: data.card});
  
    // remove starting card from server
    roomData[data.room].players.forEach((player) => {
      if(player.player_id == data.playerId)
      {
        player.player_cards.shift();
      }
    });
  
    // update who dropped the tile
    if(roomData[data.room].battle == true
      && roomData[data.room].battleRemain != 0) 
    {
      socket.emit("droppedCard", {card: 'back.png'});
    }
    else
    {
      socket.emit("droppedCard", {card: data.card});
    }

    // update the other client visually
    if(roomData[data.room].battle == true 
      && roomData[data.room].battleRemain != 0) 
    {
      socket.to(data.room).emit("OtherPlayerCard", {card: 'back.png'});
    }
    else
    {
      socket.to(data.room).emit("OtherPlayerCard", {card: data.card});
    }
    
    if(roomData[data.room].roundCards.length == PLAYERS_IN_GAME) {
      // there is a battle
      if(roomData[data.room].battle == true 
        && roomData[data.room].battleRemain != 0)
      {
        roomData[data.room].battleRemain--;
        io.to(data.room).emit("battle");
        
        // adding round cards to battle cards
        roomData[data.room].battleCards.push(roomData[data.room].roundCards[0].card);
        roomData[data.room].battleCards.push(roomData[data.room].roundCards[1].card);
      }
      else
      {
        // regular round, or not hidden turn     
        const cards = roomData[data.room].roundCards;
        
        const card1 = [cards[0].card.match(/\d+/g), cards[0].card, cards[0].playerId];
        const card2 = [cards[1].card.match(/\d+/g), cards[1].card, cards[1].playerId];
        let winner;
  
        if (card1[0] > card2[0]) {
          winner = card1[2];
          roomData[data.room].battle = false;
        } else if (card2[0] > card1[0]) {
          winner = card2[2];
          roomData[data.room].battle = false;
        } else {
          winner = "draw";
          roomData[data.room].battle = true;
          roomData[data.room].battleRemain = 2; // maybe change to 3
        }
  
        // after decisions send the right request
        if(roomData[data.room].battle == true)
        {
          io.to(data.room).emit("battle");
          roomData[data.room].battleCards.push(card1[1]);
          roomData[data.room].battleCards.push(card2[1]);
        }
        else 
        {
          // there is no battle, or it just ended
          // update the winner with the two cards on server side
          roomData[data.room].players.forEach((player) => {
            if(player.player_id == winner)
            {
              // add round cards to winner on server side
              roomData[data.room].roundCards.forEach((item) => {
                player.player_cards.push(item.card);
                console.log(item.card);
              });

              // add battle cards to winner on server side
              roomData[data.room].battleCards.forEach((card) => {
                player.player_cards.push(card);
              });
            }   
          });

          // update the winner with the two cards on client
          io.to(data.room).emit("roundResult", {
            winner: winner,
            cardsToAddToWinner: roomData[data.room].roundCards.concat(roomData[data.room].battleCards)
          });

          // reset battle cards
          roomData[data.room].battleCards = [];
        }
      }

      // reset round cards
      roomData[data.room].roundCards = [];
    }

    //console.log(roomData[data.room].battle + ", " + roomData[data.room].battleRemain);
    console.log(roomData[data.room].players);
    if(roomData[data.room].players[0].player_cards.length == 0 || roomData[data.room].players[1].player_cards.length == 0)
    {
      let max_cards = 0;
      let winner = "";
      let winner_username = "";
      let cards = [];
      roomData[data.room].players.forEach((player) => {
        cards.push(player.player_cards.length);
        if(player.player_cards.length > max_cards)
        {
          max_cards = player.player_cards.length;
          winner = player.player_id;
          winner_username = player.playerName;
        }
      });
  
      // If both players have the same score, it's a draw
      if((cards.length > 1 && (cards[0] == cards[1])) || winner == "")
      {
        winner = "draw";
      }
      io.to(data.room).emit("gameEndResponse", {winner: winner, winner_username: winner_username});
  
      // Clear the players array for the current room
      serversListClientsNumber();
      io.to(data.room).emit('serversResponse', { servers: roomData });
    }
  });

  socket.on('gameEnd', (data) => {
    let max_cards = 0;
    let winner = "";
    let winner_username = "";
    let cards = [];
    roomData[data.room].players.forEach((player) => {
      cards.push(player.player_cards.length);
      if(player.player_cards.length > max_cards)
      {
        max_cards = player.player_cards.length;
        winner = player.player_id;
        winner_username = player.playerName;
      }
    });

    // If both players have the same score, it's a draw
    if((cards.length > 1 && (cards[0] == cards[1])) || winner == "")
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
