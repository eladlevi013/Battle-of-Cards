import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";

const worlds = [{worldName: 'room1'},{worldName: 'room2'},{worldName: 'room3'}];

function StartView(props) {
    const navigate = useNavigate();
    const [selectedWorld, setSelectedWorld] = useState('');

    return (
        <div className="App">
      <p style={{color: "white", paddingTop: '80px', fontSize: '30px'}}>Pick A Server:</p>
          <Container className="App justify-content-center align-items-center" style={{width:'30%', marginTop:'10px'}}>
            {worlds.length > 0 &&
              worlds.map((world, index) => (
                  <Row style={{marginTop: '5px'}}>
                    <Button
                        variant="danger"
                        className="mb-2"
                        onClick={() => {
                            navigate("/game", {worldName: world.worldName});
                            // stSelectedWorld(world.worldName);
                      }}
                    >
                      {world.worldName}
                    </Button>
                  </Row>
              ))}
          </Container>
          <p>{props.username}</p>
        </div>
      );
      
}

export default StartView;
