import React, { useState, useEffect } from 'react';
import { Container, Row, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';
import './App.css'
import { SERVER_URL } from './config.js';
import {FaArrowLeft} from 'react-icons/fa';

function StartView() {
  const [worlds, setWorlds] = useState([]);
  const [selectedWorld, setSelectedWorld] = useState('');
  const [socket, setSocket] = useState(null);

  // getting username from previous page
  const location = useLocation();
  const username = location?.state?.username;
  const navigate = useNavigate();

  // check if username is undefined
  useEffect(() => {
    if(username === undefined)
    {
      navigate("/");
    }
  }, [location, navigate, username]);

  // Socket connection
  useEffect(() => {
    const socket = io.connect(SERVER_URL);
    setSocket(socket);
    socket.emit('serversRequest');
    return () => {
      socket.disconnect();
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('serversResponse', (data) => {
        setWorlds(data.servers);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      navigate("/game", { state: { username: username, worldName: selectedWorld} });
    }
  }, [selectedWorld]);

  return (
    <div className="App">
      <Button variant="secondary" style={{position: 'absolute', top: '15px', left: '15px'}} onClick={() => navigate("/")} ><FaArrowLeft/></Button>
      <p style={{color: "white", paddingTop: '10px', fontSize: '20px',top: '20px'}}>logged-as: {username}</p>
      <p style={{color: "white", paddingTop: '50px', fontSize: '40px', paddingBottom: '20px'}} className='App-text'>Pick A Server:</p>
      
      <Container className="App justify-content-center align-items-center" style={{width:'30%', marginTop:'10px'}}>
        {Object.keys(worlds).map((world) => (
          <Row style={{marginTop: '5px'}} key={world}>
            <Button
              variant="danger"
              className="mb-2"
              onClick={() => {
                if(worlds[world].numPlayers < 2)
                {
                  setSelectedWorld(world)
                }
          else 
          {
            toast.error("Server is full!", {
              position: "top-center",
              autoClose: 600,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "light",
              });
          }}}
            >
              {world + ' (' + worlds[world].numPlayers + '/2)'}
            </Button>
          </Row>
        ))}

      </Container>
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

export default StartView;
