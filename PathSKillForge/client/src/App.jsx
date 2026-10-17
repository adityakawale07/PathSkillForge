import { Routes, Route, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Login, Register } from "./pages/Auth.jsx"; import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx"; import Reader from "./pages/Reader.jsx";
import Flashcards from "./pages/Flashcards.jsx"; import Quiz from "./pages/Quiz.jsx"; import Profile from "./pages/Profile.jsx";

function Layout() {
  const nav = useNavigate();
  if (!localStorage.getItem("token")) return <Navigate to="/login" />;
  return (<div className="shell">
    <aside><h2>PathSkillForge</h2>
      {[["/", "Dashboard"], ["/documents", "My Documents"], ["/flashcards", "Flashcards"], ["/quizzes", "Quizzes"], ["/profile", "Profile"]]
        .map(([to, l]) => <NavLink key={to} to={to} end>{l}</NavLink>)}
      <button className="ghost" onClick={() => { localStorage.clear(); nav("/login"); }}>Logout</button>
    </aside><main><Outlet /></main></div>);
}
export default function App() {
  return (<Routes>
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} /><Route path="/documents" element={<Documents />} />
      <Route path="/documents/:id" element={<Reader />} /><Route path="/flashcards" element={<Flashcards />} />
      <Route path="/quizzes" element={<Quiz />} /><Route path="/quizzes/:id" element={<Quiz />} />
      <Route path="/profile" element={<Profile />} />
    </Route></Routes>);
}
