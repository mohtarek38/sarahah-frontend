import "./App.css";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("accessToken"));
    const handler = () => setHasToken(!!localStorage.getItem("accessToken"));
    window.addEventListener("sarahah:login", handler);
    return () => window.removeEventListener("sarahah:login", handler);
  }, []);

  return (
    <div className="App">
      <main className="App-main">{hasToken ? <Profile /> : <Login onLogin={() => setHasToken(true)} />}</main>
    </div>
  );
}

export default App;
