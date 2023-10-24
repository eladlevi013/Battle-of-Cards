import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import StartView from "./StartView";
import GameView from "./GameView";
import ServerView from "./ServerView";
import Scoreboard from "./Scoreboard";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />{" "}
      <Routes>
        <Route exact path="/" element={<StartView />} />
        <Route path="/servers" element={<ServerView />} />
        <Route path="/game" element={<GameView />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
