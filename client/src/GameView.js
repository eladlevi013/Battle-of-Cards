import React, { useState, useEffect, useRef } from 'react';
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
import {FaArrowLeft} from 'react-icons/fa';

function MyVerticallyCenteredModal(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered>

      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
        <h4>End Of The Game | room: {props.gameParams.room}</h4>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {
          props.gameParams.gameWinner == true ? 
          (
            <p>
              You Won this game!.<br/>You can return to the servers view.
            </p>
          )
          :
          (
            <p>
              You lost this game.<br/>You can return to the servers view.
            </p>
          )
        }
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={props.onButtonPress}>Back To Servers</Button>
      </Modal.Footer>
    </Modal>
  );
}

function GameView() {
  // React states
  const [roundStatus, setRoundStatus] = useState('');
  const [timeLeft, setTimeLeft] = useState(-1);
  const [showTimer, setShowTimer] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [playerId, setPlayerId] = useState(Math.floor(Math.random() * 1000000000));
  const [socket, setSocket] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [resCard, setResCard] = useState('back.png');
  const [yourTurn, setYourTurn] = useState(false);
  const [gameWinner, setGameWinner] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // getting username and room from previous page
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || '';
  const room = location.state?.worldName || '';

  // username or room is undefined
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

  // Timer handler
  useEffect(() => {
    if (!timeLeft) {
      socket.emit('gameEnd', {room: room});
      return;
    };
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);
  
  // Game End handler
  useEffect(() => {
    if (socket) {
      const handleGameEndResponse = (data) => {
        if (data.winner == 'draw') {
          toast.warning(`It's a draw!`, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          });
        } else if (data.winner == playerId) {
          setGameWinner(true);
          toast.success(`You won!`, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          });
        } else {
          toast.error(`You lost!, ${data.winner_username} won this game.`, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          });
        }
        // show modal
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

  useEffect(() => {
    if(socket)
    {
      socket.on('battle', () => {
        setYourTurn(true);
        setRoundStatus('Draw, battle starts!');
      });
    }
  }, [socket]);

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
        setGameStarted(true);
        setTimeLeft(60);
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
        if (data.winner == playerId) {
          data.cardsToAddToWinner.forEach(item => {
            setCards(cards => [...cards, item.card]);
          });
          setRoundStatus('You won this round!');
        }
        else 
        {
          setRoundStatus('You lost this round!');
        }
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on('droppedCard', (data) => {
        setSelectedCard(data.card);
      });
    }
  }, [socket]);

  return (
    <div className="App">
      <Button variant="secondary" style={{position: 'absolute', top: '15px', left: '15px'}} onClick={() => navigate("/servers", { state: { username: username } })} ><FaArrowLeft/></Button>
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
            ) 
            :
            (
              <p className="text-white App-text" style={{ paddingTop: '10px', fontSize: '40px'}}>
                {room}
              </p>
            )
          }
        </Row>

        <div className="row justify-content-center" style={{marginTop: '10px'}}>
          <div className="col-4">
            <img className='img-container'
              src={require('./cards/back.png')}
              alt="back of a card"
              style={{ width: '50%' }}
              onClick={() => {
                if(yourTurn == true && gameStarted == true)
                {
                  socket.emit('cardPlayed', {card: cards[0], room: room, playerId: playerId});
                  setCards(cards.splice(1));
                  setYourTurn(false);

                  if(cards.length == 0)
                  {
                    socket.emit('gameEnd', {room: room, playerId: playerId});
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="row justify-content-center" style={{marginTop: '30px'}}>
          <div className="col-4">
            <img 
              style={{ width: '50%' }}
              src={require('./cards/' + selectedCard)}
              alt="selected card" />
          </div>

          <div className="col-4">
            <img 
              style={{ width: '50%' }}
              src={require('./cards/' + resCard)}
              alt="result card" />
          </div>
        </div>

        <MyVerticallyCenteredModal
          show={modalShow}
          gameParams={{username: username, room: room, gameWinner: gameWinner}}
          onButtonPress={() => navigate('/Servers', { state: { username: username } })}/>
      </Container>

      <p className="text-white" style={{ paddingTop: '40px', fontSize: '20px' }}>
        Remaining Cards: {cards.length}
      </p>
      
      <p className="text-white" style={{fontSize: '20px'}}>
        {roundStatus}
      </p>

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
        theme="light"/>
    </div>
  );
}

export default GameView;
