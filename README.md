# Battle of Cards

A multiplayer online card game built using Node.js, Express, Socket.IO, and Mongoose on the server-side, and React.js and Socket.IO on the client-side.

## Game Demonstration:

<p align="center">
  <img src="https://github.com/eladlevi013/battle-of-cards/assets/60574244/9d9dcde6-a265-4c09-997a-1e5aace5e113" alt="Game Demo" width="100%">
</p>

## Installation

To install and run the game locally, you will need to have [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

1. Clone the repository: `git clone https://github.com/eladlevi013/battle-of-cards.git`
2. Navigate to the server directory: `cd battle-of-cards/server`
3. Install the dependencies: `npm install`
4. Start the server: `npm start`
5. In a new terminal window, navigate to the client directory: `cd ../client`
6. Install the dependencies: `npm install`
7. Start the client: `npm start`

## How to Play

The objective of the game is to win all the cards.

The game is played with a standard deck of 52 cards. Each player is dealt half the deck, and the cards are placed face down in a stack in front of each player.

To play a round, each player reveals the top card from their stack. The player with the higher card value takes both cards and adds them to the bottom of their stack. If the cards are of equal value, then a war occurs. In a war, each player reveals three cards face down, and then one card face up. The player with the higher face-up card wins all the cards.

The game continues until one player wins all the cards.

## Features

- Multiplayer gameplay with real-time updates using Socket.IO.
- Game state and player information are stored in a MongoDB database using Mongoose.
- Responsive and intuitive UI built using React.js.
- Easy-to-use interface for creating and joining game rooms.

## Contributing

If you find any issues or have suggestions for improvements, feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
