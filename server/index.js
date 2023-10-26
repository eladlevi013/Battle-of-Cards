// Imports
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import accountRoute from "./controllers/account.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Constants
const PORT = 3001;
const CLIENT_PORT = 3000;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;
const MONGO_URL = process.env.MONGO_URL;
const PLAYERS_IN_GAME = 2;

// Server setup
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Route setup
app.use("/api/account", accountRoute);

const serversDataSimplified = (rooms) => {
  let simplifiedData = {};

  for (let roomName in rooms) {
    if (rooms.hasOwnProperty(roomName)) {
      simplifiedData[roomName] = {
        numPlayers: rooms[roomName].players.length,
      };
    }
  }

  return simplifiedData;
};

const createRoomStruct = () => {
  return {
    roundCards: [],
    players: [],
    battleCards: [],
    battle: false,
    battleRemain: 0,
  };
};

// Creating empty rooms
const roomsData = {
  room1: createRoomStruct(),
  room2: createRoomStruct(),
  room3: createRoomStruct(),
};

// Generate cards stack
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
};

io.on("connection", (socket) => {
  // Get Servers List
  socket.on("serversRequest", () => {
    socket.emit("serversResponse", {
      servers: serversDataSimplified(roomsData),
    });
  });

  // Player joins a room
  socket.on("joinRoom", (data) => {
    socket.join(data.room);

    const roomClients = io.sockets.adapter.rooms.get(data.room).size;

    if (roomClients === 1) {
      // Delete old data
      roomsData[data.room].roundCards = [];
      roomsData[data.room].players = [];
      roomsData[data.room].battleCards = [];
      roomsData[data.room].battle = false;
      roomsData[data.room].battleRemain = 0;
      socket.emit("joinedRoom", "Waiting for other player to join");
    } else if (roomClients === PLAYERS_IN_GAME) {
      socket.emit("joinedRoom", "Game is starting");

      let cardsStack = generateCards();

      // split cards to players number in room
      let splittedCards = [
        cardsStack.splice(0, cardsStack.length / PLAYERS_IN_GAME),
        cardsStack,
      ];

      // Iterates sockets in room and send cards
      io.in(data.room)
        .fetchSockets()
        .then((sockets) => {
          sockets.forEach((socket) => {
            socket.emit("gameStart", {
              cards: splittedCards[sockets.indexOf(socket)],
            });

            roomsData[data.room].players[sockets.indexOf(socket)].player_cards =
              splittedCards[sockets.indexOf(socket)];
          });
        });
    }

    // Add the player to the room
    roomsData[data.room].players.push({
      player_id: data.playerId,
      socketId: socket.id,
      player_cards: [],
      playerName: data.playerName,
    });

    // Updating the number of players in the rooms
    io.emit("serversResponse", { servers: serversDataSimplified(roomsData) });
  });

  socket.on("cardPlayed", (data) => {
    // Update the round cards data
    roomsData[data.room].roundCards.push({
      playerId: data.playerId,
      card: data.card,
    });

    // Remove starting card from server
    roomsData[data.room].players.forEach((player) => {
      if (player.player_id == data.playerId) {
        player.player_cards.shift();
      }
    });

    // Update who dropped the tile
    if (
      roomsData[data.room].battle == true &&
      roomsData[data.room].battleRemain != 0
    ) {
      socket.emit("droppedCard", { card: "back.png" });
    } else {
      socket.emit("droppedCard", { card: data.card });
    }

    // Update the other client visually
    if (
      roomsData[data.room].battle == true &&
      roomsData[data.room].battleRemain != 0
    ) {
      socket.to(data.room).emit("otherPlayerCard", { card: "back.png" });
    } else {
      socket.to(data.room).emit("otherPlayerCard", { card: data.card });
    }

    if (roomsData[data.room].roundCards.length == PLAYERS_IN_GAME) {
      // Battle logic
      if (
        roomsData[data.room].battle == true &&
        roomsData[data.room].battleRemain != 0
      ) {
        roomsData[data.room].battleRemain--;
        io.to(data.room).emit("battle");

        // Adding round cards to battle cards
        roomsData[data.room].battleCards.push(
          roomsData[data.room].roundCards[0].card
        );
        roomsData[data.room].battleCards.push(
          roomsData[data.room].roundCards[1].card
        );
      } else {
        // Regular round, or not hidden turn
        const cards = roomsData[data.room].roundCards;

        const card1 = [
          cards[0].card.match(/\d+/g),
          cards[0].card,
          cards[0].playerId,
        ];

        const card2 = [
          cards[1].card.match(/\d+/g),
          cards[1].card,
          cards[1].playerId,
        ];
        let winner;

        if (card1[0] > card2[0]) {
          winner = card1[2];
          roomsData[data.room].battle = false;
        } else if (card2[0] > card1[0]) {
          winner = card2[2];
          roomsData[data.room].battle = false;
        } else {
          winner = "draw";
          roomsData[data.room].battle = true;
          roomsData[data.room].battleRemain = 2;
        }

        // after decisions send the right request
        if (roomsData[data.room].battle == true) {
          io.to(data.room).emit("battle");
          roomsData[data.room].battleCards.push(card1[1]);
          roomsData[data.room].battleCards.push(card2[1]);
        } else {
          // there is no battle, or it just ended
          // update the winner with the two cards on server side
          roomsData[data.room].players.forEach((player) => {
            if (player.player_id == winner) {
              // add round cards to winner on server side
              roomsData[data.room].roundCards.forEach((item) => {
                player.player_cards.push(item.card);
              });

              // add battle cards to winner on server side
              roomsData[data.room].battleCards.forEach((card) => {
                player.player_cards.push(card);
              });
            }
          });

          // update the winner with the two cards on client
          io.to(data.room).emit("roundResult", {
            winner: winner,
            cardsToAddToWinner: roomsData[data.room].roundCards.concat(
              roomsData[data.room].battleCards
            ),
          });

          // reset battle cards
          roomsData[data.room].battleCards = [];
        }
      }

      // reset round cards
      roomsData[data.room].roundCards = [];
    }

    // Game end logic
    if (
      roomsData[data.room].players[0].player_cards.length == 0 ||
      roomsData[data.room].players[1].player_cards.length == 0
    ) {
      let max_cards = 0;
      let winner = "";
      let winner_username = "";
      let cards = [];
      roomsData[data.room].players.forEach((player) => {
        cards.push(player.player_cards.length);
        if (player.player_cards.length > max_cards) {
          max_cards = player.player_cards.length;
          winner = player.player_id;
          winner_username = player.playerName;
        }
      });

      // If both players have the same score, it's a draw
      if ((cards.length > 1 && cards[0] == cards[1]) || winner == "") {
        winner = "draw";
      }
      io.to(data.room).emit("gameEndResponse", {
        winner: winner,
        winner_username: winner_username,
      });

      // Clear the players array for the current room
      io.to(data.room).emit("serversResponse", {
        servers: serversDataSimplified(roomsData),
      });
    }
  });

  socket.on("gameEnd", (data) => {
    let max_cards = 0;
    let winner = "";
    let winner_username = "";
    let cards = [];
    roomsData[data.room].players.forEach((player) => {
      cards.push(player.player_cards.length);
      if (player.player_cards.length > max_cards) {
        max_cards = player.player_cards.length;
        winner = player.player_id;
        winner_username = player.playerName;
      }
    });

    // If both players have the same score, it's a draw
    if ((cards.length > 1 && cards[0] == cards[1]) || winner == "") {
      winner = "draw";
    }
    socket.emit("gameEndResponse", {
      winner: winner,
      winner_username: winner_username,
    });

    // Clear the players array for the current room
    socket.emit("serversResponse", {
      servers: serversDataSimplified(roomsData),
    });
  });

  // On player disconnect
  socket.on("disconnect", () => {
    let roomNamePlayerLeft = null;

    // Remove the player from the room and identify the room they were in
    Object.keys(roomsData).forEach((roomName) => {
      const room = roomsData[roomName];
      const initialLength = room.players.length;
      room.players = room.players.filter(
        (player) => player.socketId !== socket.id
      );

      // Check if a player was removed from this room
      if (initialLength !== room.players.length) {
        roomNamePlayerLeft = roomName;
      }
    });

    // If a player left a room, send the "game over" message to all clients in that room
    if (roomNamePlayerLeft) {
      io.to(roomNamePlayerLeft).emit("otherPlayerLeft");
    }

    // Update servers data and emit to all clients
    io.emit("serversResponse", { servers: serversDataSimplified(roomsData) });
  });
});

mongoose.set({ strictQuery: false });
mongoose
  .connect(MONGO_URL)
  .then((results) => {
    app.listen(PORT + 1, function () {
      console.log(`Server is running via port ${PORT + 1}`);
    });
    server.listen(PORT, function () {
      console.log(`Sockets Server is running via port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
