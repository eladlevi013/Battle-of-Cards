    import React, { useState } from 'react';
    import { Container, Row, Col, Form, Button } from 'react-bootstrap';
    import 'bootstrap/dist/css/bootstrap.min.css';
    import { useNavigate } from "react-router-dom";

    function StartView(props) {
        const navigate = useNavigate();
        const [username, setUsername] = useState('');

        function handleUsernameChange(event) {
            setUsername(event.target.value);
        }

        function handleStartButtonClick() {
            navigate("/servers", {username: username});
        }

        return (
            <Container style={{paddingTop: '100px'}} className="d-flex justify-content-center align-items-center h-100">
            <Row>
                <Col xs={12} md={12} className="mx-auto">
                <h1 style={{color: 'white'}} className="text-center mb-4">Welcome To The Game</h1>
                <Form>
                    <Form.Group controlId="usernameInput">
                    <Form.Label style={{color: 'white'}}>Choose a username:</Form.Label>
                    <Form.Control
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                    />
                    </Form.Group>
                    <Button style={{width:'100%', marginTop: '10px'}} variant="primary" onClick={handleStartButtonClick}>
                    Start
                    </Button>
                </Form>
                </Col>
            </Row>
            </Container>
        );
    }

    export default StartView;
