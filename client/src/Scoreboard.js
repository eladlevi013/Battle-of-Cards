import React, { useEffect, useState } from "react";
import { Container, Row, Table, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import "./global.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_SERVER_URL } from "./config/config";

function Scoreboard() {
  const [scoreboard, setScoreboard] = useState([]);
  const navigate = useNavigate();

  function handleBackButtonClicked() {
    navigate("/");
  }

  useEffect(() => {
    axios
      .post(`${API_SERVER_URL}/account/scoreboardUsers`)
      .then((response) => {
        setScoreboard(response.data.results);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div className="App">
      <Button
        variant="secondary"
        style={{ position: "absolute", top: "15px", left: "15px" }}
        onClick={handleBackButtonClicked}
      >
        <FaArrowLeft />
      </Button>
      <Container
        style={{ paddingTop: "100px" }}
        className="d-flex justify-content-center align-items-center h-100"
      >
        <Row>
          <h1 style={{ color: "white" }} className="text-center mb-4 App-text">
            SCOREBOARD:
          </h1>

          <Table
            striped
            bordered
            hover
            size="xxl"
            variant="dark"
            style={{ marginTop: "30px" }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    color: "white",
                    fontSize: "22px",
                    paddingLeft: "40px",
                    paddingRight: "40px",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    color: "white",
                    fontSize: "22px",
                    paddingLeft: "40px",
                    paddingRight: "40px",
                  }}
                >
                  Username
                </th>
                <th
                  style={{
                    color: "white",
                    fontSize: "22px",
                    paddingLeft: "40px",
                    paddingRight: "40px",
                  }}
                >
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {scoreboard.map((user, index) => (
                <tr key={index}>
                  <td style={{ color: "white" }}>{index + 1}</td>
                  <td style={{ color: "white" }}>{user.username}</td>
                  <td style={{ color: "white" }}>{user.score}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Row>
      </Container>
    </div>
  );
}
export default Scoreboard;
