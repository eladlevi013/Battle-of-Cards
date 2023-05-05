import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import StartView from "./StartView";
import GameView from "./GameView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" component={StartView} />
        <Route path="/game" component={GameView} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
