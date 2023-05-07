import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation, useNavigate } from "react-router-dom";
import { SERVER_URL } from './config.js';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';

function MyVerticallyCenteredModal(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
        <h4>End Of The Game</h4>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          This is the game of the game. You can return to the servers view.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onButtonPress}>Back To Servers</Button>
      </Modal.Footer>
    </Modal>
  );
}

function GameView() {
  const [timeLeft, setTimeLeft] = useState(-1);
  const [showTimer, setShowTimer] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [playerId, setPlayerId] = useState(Math.floor(Math.random() * 1000000000));
  const [socket, setSocket] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [resCard, setResCard] = useState('back.png');
  const [yourTurn, setYourTurn] = useState(true);
  const [battle, setBattle] = useState(false);
  const [rerenderSelectedCard, setRerenderSelectedCard] = useState(false);


  // getting username and room from previous page
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || '';
  const room = location.state?.worldName || '';

  useEffect(() => {
    if (!timeLeft) {
      socket.emit('gameEnd', {room: room});
      return;
    };
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    // Clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
  }, [timeLeft]);
  
  useEffect(() => {
    if (socket) {
      const handleGameEndResponse = (data) => {
        if (data.winner == 'draw') {
          toast.warning(`It's a draw!`, {
          });
        } else if (data.winner == playerId) {
          toast.success(`You won!`, {
          });
        } else {
          toast.error(`You lost!, ${data.winner_username} won this game.`, {
          });
        }
        setModalShow(true);
        socket.disconnect();
  
        // updateing the server with the new win count
        const dataRequest = {
          username: username,
          score: cards.length // Update the score here
        };
  
        axios.post(`http://localhost:3002/api/account/registerScore`, dataRequest)
          .then(response => {
            console.log(response.data);
          })
          .catch(error => {
            console.error(error);
          });
      };
  
      socket.on('gameEndResponse', handleGameEndResponse);
  
      return () => {
        socket.off('gameEndResponse', handleGameEndResponse);
      };
    }
  }, [socket, cards]);
     

  // check if username or room is undefined
  useEffect(() => {
    if (!username || !room) {
      navigate('/');
    } else if (username && !room) {
      navigate('/server', { state: { username: username } });
    }
  }, [username, room, navigate]);

  // Socket connection
  useEffect(() => {
    const socket = io.connect(SERVER_URL);
    setSocket(socket);
    setYourTurn(true);
    socket.emit('joinRoom', {room: room, playerId: playerId, playerName: username});
    return () => {
      socket.disconnect();
    }
  }, []);

  useEffect(() => {
    if(socket)
    {
      socket.on('battle', () => {
        setYourTurn(true);
        setBattle(true);
      });
    }
  }, [socket]);

  // updates the dropped card to the other players
  useEffect(() => {
    if (socket && selectedCard) { // add checks for all required variables
      socket.emit('cardPlayed', {card: cards[0], room: room, playerId: playerId});
      setCards(cards.splice(1));
      console.log("REQUEST");
      setYourTurn(false);
    }
  }, [selectedCard, rerenderSelectedCard]);

  useEffect(() => {
    if (socket) {
      socket.on('joinedRoom', (data) => {
        toast.warning(data, {
          position: "top-center",
          autoClose: 600,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          });      
      });
    }
  }, [socket]);

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
        setTimeLeft(30);
        setShowTimer(true);
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
    if (socket) {
      socket.on('roundResult', (data) => {
        setYourTurn(true);
        setBattle(false);
        if (data.winner == playerId) {
          // add to cards data.loseCard
          // data.cardsToAddToWinner.
          data.cardsToAddToWinner.forEach(item => {
            if(item.playerId == playerId) {
              setCards(cards => [...cards, item.card]);
            }
          });
        }
      });
    }
  }, [socket]);

  return (
    <div className="App">
      <p className="text-white" style={{ paddingTop: '10px', fontSize: '13px' }}>
        playerId: {playerId}, logged-as: {username}, in room: {room}
      </p>
      <Container>
        <Row>
          {
            showTimer == true ? (
              <p className="text-white App-text" style={{ paddingTop: '10px', fontSize: '40px'}}>
              {room} | Time Left: {timeLeft}
            </p>
            ) : (
              <p className="text-white App-text" style={{ paddingTop: '10px', fontSize: '40px'}}>
              {room}
            </p>
            )
          }
        </Row>

  <div className="row justify-content-center" style={{marginTop: '10px'}}>
    <div className="col-4">
    <img
        src={require('./cards/back.png')}
        alt="back of a card"
        style={{ width: '50%' }}
        onClick={() => {
          if(yourTurn == true)
          {
            if(battle == true)
            {
              if(selectedCard == 'back.png')
              {
                setRerenderSelectedCard(prevRerender => !prevRerender);
              }
              else 
              {
                setSelectedCard('back.png');
              }
            }
            else if (cards.length > 0) 
            {
              if(cards[0] == selectedCard)
              {
                setRerenderSelectedCard(prevRerender => !prevRerender);
              }
              else 
              {
                setSelectedCard(cards[0]);
              }              
            }
          }
        }}
      />
    </div>
  </div>

  <div className="row justify-content-center" style={{marginTop: '30px'}}>
    <div className="col-4">
    <img         style={{ width: '50%' }} src={require('./cards/' + selectedCard)} alt="selected card" />
    </div>
    <div className="col-4">
    <img         style={{ width: '50%' }}
 src={require('./cards/' + resCard)} alt="result card" />    </div>
  </div>

  <MyVerticallyCenteredModal
    show={modalShow}
    onButtonPress={() => navigate('/Servers', { state: { username: username } })}
  />
      </Container>
      <p className="text-white" style={{ paddingTop: '40px', fontSize: '20px' }}>
        Remaining Cards: {cards.length}
        {/* {cards.map((card, index) => (
          <p>
            {index + 1}: {card}
            </p>
        ))} */}
      </p>
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
