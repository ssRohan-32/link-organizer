import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        {/* If logged in, redirect '/' to '/dashboard' */}
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" />
              : <Login onLogin={() => setIsLoggedIn(true)} />
          }
        />

        {/* Protected dashboard */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn
              ? <Dashboard onLogout={() => setIsLoggedIn(false)} />
              : <Navigate to="/" />
          }
        />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;