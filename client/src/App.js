import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';import './App.css';
import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const URL = 'http://localhost:3001' //end point of the server
const cards = [
  {
    cardSource: "https://res.cloudinary.com/united-app/image/upload/v1682833257/cards/ice_crust_drfmtr.png",
    power: 8
  },
  {
    cardSource: "https://res.cloudinary.com/united-app/image/upload/v1682833257/cards/light_strike_njkdsj.png",
    power: 8
  },
  {
    cardSource: "https://res.cloudinary.com/united-app/image/upload/v1682833257/cards/haze_v0nohr.png",
    power: 8
  },
  {
    cardSource: "https://res.cloudinary.com/united-app/image/upload/v1682833257/cards/fire_flower_ws2y0f.png",
    power: 8
  },
];

const worlds = [
  {
    worldName: 'room1'
  },
  {
    worldName: 'room2'
  },
  {
    worldName: 'room3'
  }
]

const socket = io.connect(URL);

function App() {
  const [roomStatus, setRoomStatus] = useState("Not Connected");
  const [selectedCard, setSelectedCard] = useState('back.png');
  const [selectedWorld, setSelectedWorld] = useState('');
  const [resCard, setResCard] = useState('back.png');
  const [cards, setCards] = useState(['1C.png']);

  const changeWorld = (newWorldName) => {
    if(newWorldName != selectedWorld)
    {
      if(selectedWorld != {})
      {
        socket.emit("leave_world", (selectedWorld));
      }
      setSelectedWorld(newWorldName);
    }
  }
  useEffect(() => {
    socket.emit("join_world", selectedWorld);
  }, [selectedWorld]);

  useEffect(() => {
    socket.on("join_world_feedback", (data) => {
      setRoomStatus(data);
      console.log(data);
      if(data == "game starting!")
      {
        toast("game is starting!");
        // calling the server function that starts the game
        console.log(selectedWorld);
        socket.emit("start_game", selectedWorld);
      }
    })
  }, [socket])

  useEffect(() => {
    socket.on("start_game_feedback", (data) => {
      setCards(data);
    }
  )}, [socket])
      

  useEffect(() => {
    console.log(selectedCard, selectedWorld, "selected card and world");
    if (selectedWorld) {
      socket.emit("send_message", { selectedCard: selectedCard, selectedWorld: selectedWorld });
    }
  }, [selectedCard]);  

  useEffect(() => {
    socket.on("get_message", (data) => {
      setResCard(data);
      console.log("THIS IS WHAT YOU ARE LOOKING FOR " + data);
    });
  }, [socket]);


  return (
    <div className="App">

      <Container style={{paddingTop: '20px'}}>
        <Row>
          {
            worlds.length > 0 && worlds.map((world, index) => (
              <Col xl={4} xs={4} sm={4}>
                <Button variant='danger' onClick={() => { changeWorld(world); }}>
                  {world.worldName}
                </Button>
              </Col>
            ))
          }

        <p style={{color:"white", paddingTop: '10px'}}>Room Status: {roomStatus}</p>

          {
            // cards.length > 0 && cards.map((card, index) => (
            //   <Col xl={3} xs={6} sm={3}>
                // <Button onClick={() => {
                //   setSelectedCard(card)
                // }}>
            //       <img style={{ width: '100%' }} src={card.cardSource} />
            //     </Button>
            //   </Col>
            // ))
            <Col xl={3} xs={3} sm={3} className="mx-auto text-center">
            <Button style={{backgroundColor: '#282c34', padding: '10px'}} onClick={() => {
              if (cards.length > 0) {
                const [selected, ...remaining] = cards; // get the first element of the array and the remaining elements
                setSelectedCard(selected); // set the first element as the selected card
                setCards(remaining); // set the remaining elements as the new array of cards
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
