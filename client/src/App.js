import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';import './App.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const rooms = [
  {roomName: 'room1'},
  {roomName: 'room2'},
  {roomName: 'room3'}
]

function App() {
  const socket = io.connect('http://localhost:3001');

  // room state variables
  const [roomStatus, setRoomStatus] = useState("Not Connected");
  const [selectedRoom, setSelectedRoom] = useState('');
  // card state variables
  const [cards, setCards] = useState(['1C.png', '2C.png']);
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [receivedCard, setReceivedCard] = useState('back.png');

  const changeRoom = (newRoomName) => {
    // other room selected
    if(newRoomName != selectedRoom)
    {
      // leave current room
      if(selectedRoom != '')
      {
        socket.emit("leave_room", ({selectedRoom: selectedRoom}));
      }
      // join new room
      setSelectedRoom(newRoomName);
    }
  }

  // updates the dropped card to the other players
  useEffect(() => {
    if (selectedRoom) {
      socket.emit("dropped_card", { selectedCard: selectedCard, selectedRoom: selectedRoom });
    }
  }, [selectedCard]);  

  // join room on page load
  useEffect(() => {
    socket.emit("join_room", {selectedRoom: selectedRoom});
  }, [selectedRoom]);

  // join room server status
  useEffect(() => {
    socket.on("join_room_status", (data) => {
      setRoomStatus(data);
      console.log(data + " status");
      console.log("joining room " + selectedRoom);

      if(data == "game starting!")
      {
        toast("game is starting!");
        socket.emit("start_game", selectedRoom);
      }
    });

    socket.on("starting_cards", (data) => {
      setCards(data);
    });

    socket.on("other_player_dropped_card", (data) => {
      console.log("other player dropped card " + data);
      setReceivedCard(data);
    });
  }, [socket])

  return (
    <div className="App">
      {selectedRoom !== '' ? 
        (<h1 style={{color: "white", paddingTop: '30px'}}>You are in room {selectedRoom}</h1>): 
        (<h1 style={{color: "white", paddingTop: '30px'}}>Select a room {selectedRoom}</h1>)
      }

      <Container style={{paddingTop: '20px'}}>
        <Row>
          {
            rooms.length > 0 && rooms.map((room, index) => (
              <Col key={room.roomName} xl={4} xs={4} sm={4}>
                <Button style={{width: '50%'}} size="lg" variant='warning' onClick={() => { changeRoom(room.roomName); }} >
                  {room.roomName}
                </Button>
              </Col>
            ))
          }
        </Row>
      </Container>
      <p style={{color:"white", paddingTop: '10px'}}>Room Status: {roomStatus}</p>

      {selectedRoom !== '' ? (
        <>
        <Container style={{paddingTop: '50px'}}>
          <Row>
            <Col xl={3} xs={3} sm={3} className="mx-auto text-center">
              <img style={{ width: '65%' }} src={require('./cards/back.png')} onClick={() => {
                if (cards.length > 0) {
                  const [selected, ...remaining] = cards;
                  setSelectedCard(selected);
                  setCards(remaining);
                }
              }} />
            </Col>
          </Row>
        </Container>

        <Container style={{paddingTop: '35px'}}>
        <Row xl={3} xs={3} sm={3}>
          <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + selectedCard )} /></Col>
          <Col xl={6} xs={6} sm={6}><img style={{ width: '30%' }} src={require('./cards/' + receivedCard)} /></Col>
        </Row>
        </Container>
        <p style={{color: "white", paddingTop: '20px'}}>{cards.join(" ")}</p>
        </>
       ) : null
      }
      <ToastContainer />
    </div>
  );
}

export default App;
