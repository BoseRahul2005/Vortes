import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import RequireAuth from "./auth/requireAuth";
import Onboard from "./pages/Onboard";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/onboard"
          element={
            <RequireAuth>
              <Onboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}
export default App;
