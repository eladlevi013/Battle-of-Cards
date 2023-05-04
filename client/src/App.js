import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';import './App.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const URL = 'http://localhost:3001'; //end point of the server
const worlds = [{worldName: 'room1'},{worldName: 'room2'},{worldName: 'room3'}];

function App() {
  const [socket, setSocket] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState('');
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [resCard, setResCard] = useState('back.png');
  const [yourTurn, setYourTurn] = useState(true);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const socket = io.connect(URL);
    setSocket(socket);
    return () => {
      socket.disconnect();
    }
  }, []);

  // calling room socket event
  useEffect(() => {
    if (socket) {
      socket.emit('joinRoom', selectedWorld);
    }
  }, [selectedWorld]);

  useEffect(() => {
    if (socket) {
      socket.emit('cardPlayed', {card: selectedCard, room: selectedWorld, playerName: playerName});
    }
  }, [selectedCard]);

// calling gameStart socket event
useEffect(() => {
  if (socket) {
    socket.on('giveCards', (data) => {
      console.log('Game has started!');
      setCards(data.cards);
    });

    socket.on('OtherPlayerCard', (data) => {
      setResCard(data.card);
    });
  }
}, [socket]);

useEffect(() => {
  if(socket)
  {
    socket.on('roundResult', (data) => {
      if(data.winner == playerName)
      {
        toast("You won this time!");
      }
      setYourTurn(true);
  })

  socket.on('joinedRoom', (data) => {
    setPlayerName(data.playerName);
    console.log('player name is: ' + playerName);
  })
}
}, [socket, playerName])

  return (
    <div className="App">
      <Container style={{paddingTop: '20px'}}>
        <Row>
        {
          worlds.length > 0 && worlds.map((world, index) => (
            <Col key={index} xl={4} xs={4} sm={4}>
              <Button variant='danger' onClick={() => { setSelectedWorld(world.worldName); }}>
                {world.worldName}
              </Button>
            </Col>
          ))
        }

        <p style={{color:"white", paddingTop: '10px'}}>Room Status: {selectedWorld}</p>
          {
            <Col xl={3} xs={3} sm={3} className="mx-auto text-center">
            <Button style={{backgroundColor: '#282c34', padding: '10px'}} onClick={() => {
              if (cards.length > 0 && yourTurn) {
                const [selected, ...remaining] = cards; // get the first element of the array and the remaining elements
                setSelectedCard(selected); // set the first element as the selected card
                setCards(remaining); // set the remaining elements as the new array of cards
                setYourTurn(false);
              }
            }} >
              <img style={{ width: '100%' }} src={require('./cards/back.png')} />
              </Button>
            </Col>
          }
        </Row>
      </Container>

      <Container style={{paddingTop: '35px'}}>
      <Row xl={3} xs={3} sm={3}>
        <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + selectedCard )} /></Col>
        <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + resCard)} /></Col>
      </Row>
      </Container>
      <p style={{color: "white", paddingTop: '20px'}}>{cards.join(" ")}</p>
      <ToastContainer />
    </div>
  );
}

export default App;
