import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./src/Admin";
import Display from "./src/Display";

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