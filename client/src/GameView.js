// Imports
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import toast from "react-hot-toast";
import "./global.css";
import { Button, Container, Row } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { API_SERVER_URL, SOCKET_SERVER_URL } from "./config/config";
import {
  JOIN_ROOM_SOCKET_EVENT,
  JOINED_ROOM_SOCKET_EVENT,
  GAME_START_SOCKET_EVENT,
  OTHER_PLAYER_CARD_SOCKET_EVENT,
  ROUND_RESULT_SOCKET_EVENT,
  DROPPED_CARD_SOCKET_EVENT,
  BATTLE_SOCKET_EVEMT,
  CARD_PLAYED_SOCKET_EVENT,
  GAME_END_SOCKET_EVENT,
  GAME_END_RESPONSE_SOCKET_EVENT,
} from "./config/socketEvents";

// Opens customized booststrap modal
function GameEndModal(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          <h4>End Of The Game | room: {props.gameParams.room}</h4>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {props.gameParams.gameWinner === true ? (
          <p>
            You Won this game!.
            <br />
            You can return to the servers view.
          </p>
        ) : (
          <p>
            You lost this game.
            <br />
            You can return to the servers view.
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={props.onButtonPress}>Back To Servers</Button>
      </Modal.Footer>
    </Modal>
  );
}

function GameView() {
  const [roundStatus, setRoundStatus] = useState("");
  const [timeLeft, setTimeLeft] = useState(-1);
  const [showTimer, setShowTimer] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [playerId, setPlayerId] = useState(
    Math.floor(Math.random() * 1000000000)
  );
  const [socket, setSocket] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("back.png");
  const [resCard, setResCard] = useState("back.png");
  const [yourTurn, setYourTurn] = useState(false);
  const [gameWinner, setGameWinner] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // getting username and room from previous page
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "";
  const room = location.state?.worldName || "";

  // username or room is undefined handler
  useEffect(() => {
    if (!username || !room) {
      navigate("/");
    } else if (username && !room) {
      navigate("/server", { state: { username: username } });
    }
  }, [username, room, navigate]);

  // Socket connection on mount
  useEffect(() => {
    const socket = io.connect(SOCKET_SERVER_URL);
    setSocket(socket);
    setYourTurn(true);
    socket.emit(JOIN_ROOM_SOCKET_EVENT, {
      room: room,
      playerId: playerId,
      playerName: username,
    });
    return () => {
      socket.disconnect();
      toast.dismiss();
    };
  }, []);

  // Timer handler
  useEffect(() => {
    if (!timeLeft) {
      socket.emit(GAME_END_SOCKET_EVENT, { room: room });
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Game End handler
  useEffect(() => {
    if (socket) {
      const handleGameEndResponse = (data) => {
        if (data.winner === "draw") {
          toast.custom(`It's a draw!`);
        } else if (data.winner === playerId) {
          setGameWinner(true);
          toast.success(`You won!`);
        } else {
          toast.error(`You lost!, ${data.winner_username} won this game.`);
        }

        // Show Modal
        setModalShow(true);
        setTimeLeft(-1);
        setShowTimer(false);
        socket.disconnect();

        // Update score
        const dataRequest = {
          username: username,
          score: cards.length,
        };

        axios
          .post(`${API_SERVER_URL}/account/registerScore`, dataRequest)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            console.error(error);
          });
      };

      socket.on(GAME_END_RESPONSE_SOCKET_EVENT, handleGameEndResponse);

      return () => {
        if (socket) {
          socket.off(GAME_END_RESPONSE_SOCKET_EVENT, handleGameEndResponse);
        }
      };
    }
  }, [socket, cards]);

  useEffect(() => {
    if (socket) {
      socket.on(BATTLE_SOCKET_EVEMT, () => {
        setYourTurn(true);
        setRoundStatus("Draw, battle starts!");
      });
    }

    return () => {
      if (socket) {
        socket.off(BATTLE_SOCKET_EVEMT);
      }
    };
  }, [socket]);

  const waitForGameStart = () => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("Socket is not initialized"));
        return;
      }

      socket.on(GAME_START_SOCKET_EVENT, (data) => {
        resolve(data);
      });
    });
  };

  useEffect(() => {
    if (socket) {
      socket.on(JOINED_ROOM_SOCKET_EVENT, (data) => {
        const promise = waitForGameStart();

        toast.promise(promise, {
          loading: "Loading for other player...",
          success: (data) => {
            setCards(data.cards);
            setGameStarted(true);
            setTimeLeft(60);
            setShowTimer(true);
            return "Game Started!";
          },
          error: (err) => `This just happened: ${err.toString()}`,
        });

        // Clean up listeners on unmount or if socket dependency changes
        return () => {
          socket.off(GAME_START_SOCKET_EVENT);
        };
      });
    }
  }, [socket]);

  // calling gameStart socket event
  useEffect(() => {
    console.log("socket:" + socket);
    if (socket) {
      socket.on(OTHER_PLAYER_CARD_SOCKET_EVENT, (data) => {
        setResCard(data.card);
      });

      socket.on("otherPlayerLeft", () => {
        toast.error(`Other player left the game!`, {
          duration: 2000,
        });
        setTimeout(() => {
          navigate("/servers", { state: { username: username } });
        }, 2000);
      });

      // return () => {
      //   if (socket) {
      //     socket.off(OTHER_PLAYER_CARD_SOCKET_EVENT);
      //   }
      // };
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on(ROUND_RESULT_SOCKET_EVENT, (data) => {
        setYourTurn(true);
        if (data.winner === playerId) {
          data.cardsToAddToWinner.forEach((item) => {
            setCards((cards) => [...cards, item.card]);
          });
          setRoundStatus("You won this round!");
        } else {
          setRoundStatus("You lost this round!");
        }
      });
    }

    return () => {
      if (socket) {
        socket.off(ROUND_RESULT_SOCKET_EVENT);
      }
    };
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on(DROPPED_CARD_SOCKET_EVENT, (data) => {
        setSelectedCard(data.card);
      });
    }

    return () => {
      if (socket) {
        socket.off(DROPPED_CARD_SOCKET_EVENT);
      }
    };
  }, [socket]);

  return (
    <div className="App">
      <Button
        variant="secondary"
        style={{ position: "absolute", top: "15px", left: "15px" }}
        onClick={() => navigate("/servers", { state: { username: username } })}
      >
        <FaArrowLeft />
      </Button>
      <p
        className="text-white"
        style={{ paddingTop: "10px", fontSize: "13px" }}
      >
        playerId: {playerId}, logged-as: {username}, in room: {room}
      </p>

      <Container>
        <Row>
          {showTimer === true ? (
            <p
              className="text-white App-text"
              style={{ paddingTop: "10px", fontSize: "40px" }}
            >
              {room} | Time Left: {timeLeft}
            </p>
          ) : (
            <p
              className="text-white App-text"
              style={{ paddingTop: "10px", fontSize: "40px" }}
            >
              {room}
            </p>
          )}
        </Row>

        <div
          className="row justify-content-center"
          style={{ marginTop: "10px" }}
        >
          <div className="col-4">
            <img
              className="img-container"
              src={"./cards/back.png"}
              alt="back of a card"
              style={{ width: "50%" }}
              onClick={() => {
                if (yourTurn === true && gameStarted === true) {
                  socket.emit(CARD_PLAYED_SOCKET_EVENT, {
                    card: cards[0],
                    room: room,
                    playerId: playerId,
                  });
                  setCards(cards.splice(1));
                  setYourTurn(false);

                  if (cards.length === 0) {
                    socket.emit(GAME_END_SOCKET_EVENT, {
                      room: room,
                      playerId: playerId,
                    });
                  }
                }
              }}
            />
          </div>
        </div>

        <div
          className="row justify-content-center"
          style={{ marginTop: "30px" }}
        >
          <div className="col-4">
            <img
              style={{ width: "50%" }}
              src={"./cards/" + selectedCard}
              alt="selected card"
            />
          </div>

          <div className="col-4">
            <img
              style={{ width: "50%" }}
              src={"./cards/" + resCard}
              alt="result card"
            />
          </div>
        </div>

        <GameEndModal
          show={modalShow}
          gameParams={{
            username: username,
            room: room,
            gameWinner: gameWinner,
          }}
          onButtonPress={() =>
            navigate("/Servers", { state: { username: username } })
          }
        />
      </Container>

      <p
        className="text-white"
        style={{ paddingTop: "40px", fontSize: "20px" }}
      >
        Remaining Cards: {cards.length}
      </p>

      <p className="text-white" style={{ fontSize: "20px" }}>
        {roundStatus}
      </p>
    </div>
  );
}

export default GameView;
