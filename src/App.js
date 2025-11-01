import "./App.css";
import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ConfirmEmail from "./pages/ConfirmEmail";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

function App() {
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem("accessToken"));

  const handleLogin = () => {
    setHasToken(true);
  };

  const handleLogout = () => {
    setHasToken(false);
  };

  return (
    <ThemeProvider>
      <div className="App">
        <main className="App-main">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/profile" element={hasToken ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/" element={hasToken ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
            <Route path="/:userId" element={<PublicProfile />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
