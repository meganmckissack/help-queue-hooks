import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import TicketControl from "./TicketControl";
import SingIn from "./SignIn";

function App(){
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/sign-in' element={<SingIn />} />
        <Route path='/' element={<TicketControl />} />
      </Routes>
    </Router>
  );
}

export default App;