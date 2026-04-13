import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import Display from "./Display";

console.log("NEW BUILD WORKING");

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Display />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
