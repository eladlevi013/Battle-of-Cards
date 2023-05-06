import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import './App.css'
import { generateUsername } from 'username-generator';

function StartView() {
    const [username, setUsername] = useState('');

    // getting navigate function
    const navigate = useNavigate();

    function handleUsernameChange(event) {
        setUsername(event.target.value);
    }

    function handleRandomUsernameButtonClick() {
        setUsername(generateUsername('-'));
    }

    function handleStartButtonClick() {
        if(username == '')
        {
            toast.error(`Username cannot be empty!`, {
                position: "top-center",
                autoClose: 600,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
                });
        }
        else if(username.length < 3)
        {
            toast.error(`Username must be at least 3 characters long!`, {
                position: "top-center",
                autoClose: 600,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
        else
        {
            navigate("/servers", { state: { username: username } });
        }
    }

    return (
        <Container style={{paddingTop: '100px'}} className="d-flex justify-content-center align-items-center h-100">
        <Row>
            <Col xs={12} md={12} className="mx-auto">
            <h1 style={{color: 'white'}} className="text-center mb-4 App-text">Welcome To The Game</h1>
            <Form style={{marginTop: '50px'}}>

                <InputGroup className="mb-3">
                    <Form.Control
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Player Username"
                    aria-describedby="button"/>

                    <Button variant="outline-secondary" id="button"
                        onClick={handleRandomUsernameButtonClick}>
                        Random Username
                    </Button>
                </InputGroup>
                
                <Button style={{width:'100%'}} variant="primary" onClick={handleStartButtonClick}>
                    Start
                </Button>
            </Form>
            </Col>
        </Row>
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
        </Container>
    );
}
export default StartView;
