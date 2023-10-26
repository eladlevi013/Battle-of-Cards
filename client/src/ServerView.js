import React, { useState, useEffect } from "react";
import { Container, Row, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import io from "socket.io-client";
import "./global.css";
import { SOCKET_SERVER_URL } from "./config/config.js";
import { FaArrowLeft } from "react-icons/fa";

function StartView() {
  const [worlds, setWorlds] = useState([]);
  const [selectedWorld, setSelectedWorld] = useState("");
  const [socket, setSocket] = useState(null);

  // Getting username from previous page
  const location = useLocation();
  const username = location?.state?.username;
  const navigate = useNavigate();

  // Check if username is undefined
  useEffect(() => {
    if (username === undefined) {
      navigate("/");
    }
  }, [location, navigate, username]);

  // Socket connection
  useEffect(() => {
    const socket = io.connect(SOCKET_SERVER_URL);
    setSocket(socket);
    socket.emit("serversRequest");
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("serversResponse", (data) => {
        setWorlds(data.servers);
        console.log(data.servers);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      navigate("/game", {
        state: { username: username, worldName: selectedWorld },
      });
    }
  }, [selectedWorld]);

  return (
    <div className="App">
      <Button
        variant="secondary"
        style={{ position: "absolute", top: "15px", left: "15px" }}
        onClick={() => navigate("/")}
      >
        <FaArrowLeft />
      </Button>
      <p
        style={{
          color: "white",
          paddingTop: "10px",
          fontSize: "20px",
          top: "20px",
        }}
      >
        logged-as: {username}
      </p>
      <p
        style={{
          color: "white",
          paddingTop: "50px",
          fontSize: "40px",
          paddingBottom: "20px",
        }}
        className="App-text"
      >
        Pick A Server:
      </p>

      <Container
        className="App justify-content-center align-items-center"
        style={{
          maxWidth: "450px",
          marginTop: "10px",
          margin: "auto",
        }}
      >
        {Object.keys(worlds).map((world) => (
          <Row style={{ marginTop: "5px" }} key={world}>
            <Button
              variant="danger"
              className="mb-2"
              onClick={() => {
                if (worlds[world].numPlayers < 2) {
                  setSelectedWorld(world);
                } else {
                  toast.error("Server is full!", {
                    position: "top-center",
                    autoClose: 600,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                  });
                }
              }}
            >
              {world + " (" + worlds[world].numPlayers + "/2)"}
            </Button>
          </Row>
        ))}
      </Container>
    </div>
  );
}

export default StartView;
