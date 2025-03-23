import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomForm from "./components/RoomForm";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomForm />} />
      </Routes>
    </Router>
  );
};

export default App;
