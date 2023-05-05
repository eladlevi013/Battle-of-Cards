import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import StartView from "./StartView";
import GameView from "./GameView";
import ServerView from './ServerView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<StartView />} />
        <Route path="/servers" element={<ServerView />} />
        <Route path="/game" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
