import { BrowserRouter, Routes, Route } from "react-router-dom";
import NailStudio from "./NailStudio";
import AdminPanel from "./AdminPanel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<NailStudio />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}