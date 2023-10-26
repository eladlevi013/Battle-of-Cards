import React, { useState } from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import "./global.css";
import { generateUsername } from "username-generator";
import toast from "react-hot-toast";

function StartView() {
  const [username, setUsername] = useState("");

  // Getting navigate function
  const navigate = useNavigate();

  function handleScoreboardButtonClick() {
    navigate("/scoreboard");
  }

  function handleUsernameChange(event) {
    setUsername(event.target.value);
  }

  function handleRandomUsernameButtonClick() {
    setUsername(generateUsername("-"));
  }

  function handleStartButtonClick() {
    if (username === "") {
      toast.error(`Username cannot be empty!`);
    } else if (username.length < 3) {
      toast.error(`Username must be at least 3 characters long!`);
    } else {
      navigate("/servers", { state: { username: username } });
    }
  }

  return (
    <Container
      style={{ paddingTop: "100px" }}
      className="d-flex justify-content-center align-items-center h-100"
    >
      <Row>
        <Col xs={12} md={12} className="mx-auto">
          <h1 style={{ color: "white" }} className="text-center mb-4 App-text">
            Welcome To The Game
          </h1>
          <Form style={{ marginTop: "50px" }}>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Player Username"
                aria-describedby="button"
              />

              <Button
                variant="outline-secondary"
                id="button"
                onClick={handleRandomUsernameButtonClick}
              >
                Random Username
              </Button>
            </InputGroup>

            <Row>
              <Col>
                <Button
                  style={{ width: "100%" }}
                  variant="primary"
                  onClick={handleStartButtonClick}
                  className="img-container"
                >
                  Start
                </Button>
              </Col>
              <Col>
                <Button
                  style={{ width: "100%" }}
                  variant="secondary"
                  onClick={handleScoreboardButtonClick}
                  className="img-container"
                >
                  Scoreboard
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
export default StartView;
