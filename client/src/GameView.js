import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const URL = 'http://localhost:3001'; //end point of the server
const worlds = [{worldName: 'room1'},{worldName: 'room2'},{worldName: 'room3'}];

function GameView() {
  // States variables
  const [socket, setSocket] = useState(null);
  const [selectedWorld, setSelectedWorld] = useState('');
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [resCard, setResCard] = useState('back.png');
  const [yourTurn, setYourTurn] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [winCount, setWinCount] = useState(0);

  // Socket connection
  useEffect(() => {
    const socket = io.connect(URL);
    setSocket(socket);
    return () => {
      socket.disconnect();
    }
  }, []);

  // calling room socket event
  useEffect(() => {
    if (socket && selectedWorld) { // add a check for selectedWorld to avoid unnecessary calls
      socket.emit('joinRoom', selectedWorld);

      // reset states
      setCards([]);
      setSelectedCard('back.png');
      setResCard('back.png');
      setYourTurn(true);
      setPlayerName('');
      setWinCount(0);
    }
  }, [socket, selectedWorld]);

  // updates the dropped card to the other players
  useEffect(() => {
    if (socket && selectedCard && selectedWorld && playerName && !yourTurn) { // add checks for all required variables
      socket.emit('cardPlayed', {card: selectedCard, room: selectedWorld, playerName: playerName});
    }
  }, [selectedCard, selectedWorld, playerName, socket, yourTurn]);

  useEffect(() => {
    if(socket) {
      socket.on('gameStart', (data) => {
        toast.success(`Game Started!`, {
          position: "top-center",
          autoClose: 600,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          });
        setCards(data.cards);
      });
    }
  }, [socket, toast]);

  // calling gameStart socket event
  useEffect(() => {
    if (socket) {
      socket.on('OtherPlayerCard', (data) => {
        setResCard(data.card);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket && playerName) { // add a check for playerName to avoid unnecessary calls
      socket.on('roundResult', (data) => {
        if (data.winner === playerName) {
          setWinCount(winCount => winCount + 1); // use a function updater for winCount to avoid stale state
        }
        setYourTurn(true);
        console.log('turn on');
      });
    }
  }, [socket, playerName]);

  useEffect(() => {
    if (socket) {
      socket.on('joinedRoom', (data) => {
        setPlayerName(data.playerName);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (winCount > 0) {
      toast.success(`You won this round! ${winCount} points`, {
        position: "top-center",
        autoClose: 600,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
        });
    }
  }, [winCount, toast]);

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
        </Row>
        </Container>

        <Container style={{paddingTop: '20px', alignContent: 'center'}}>
        <Row>
        <p style={{color:"white", paddingTop: '10px'}}>Room Status: {selectedWorld}</p>
          {
            <Col xl={3} xs={3} sm={3} className="mx-auto text-center">
            <Button style={{backgroundColor: '#282c34', padding: '10px', width: '70%'}} onClick={() => {
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
        <Row xl={3} xs={3} sm={3}>
          <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + selectedCard )} /></Col>
          <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + resCard)} /></Col>
        </Row>
      </Container>
      <p style={{color: "white", paddingTop: '30px', fontSize: '30px'}}>Points: {winCount} ({playerName})</p>
      <p style={{color: "white", paddingTop: '0px', fontSize: '30px'}}>Remaning Cards: {cards.length}</p>
      
      {/* Toastify Settings */}
      <ToastContainer
        position="top-center"
        autoClose={600}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default GameView;
