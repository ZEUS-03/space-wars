import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomForm from "./components/RoomForm";
import { useEffect } from "react";
import { baseURL } from "../constants";

const App = () => {
  useEffect(() => {
    const wakeServerCall = async () => {
      const response = await fetch(`${baseURL}ping`);
      console.log(response);
    };
    wakeServerCall();
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomForm />} />
      </Routes>
    </Router>
  );
};

export default App;
