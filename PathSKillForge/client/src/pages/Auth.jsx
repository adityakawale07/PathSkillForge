import { useState } from "react"; import { Link, useNavigate } from "react-router-dom"; import api from "../api";
function Form({ mode }) {
  const [f, setF] = useState({}); const [err, setErr] = useState(""); const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setErr("");
    if (mode === "register" && f.password !== f.confirm) return setErr("Passwords do not match");
    try { const { data } = await api.post(`/auth/${mode}`, f); localStorage.setItem("token", data.token); nav("/"); }
    catch (e) { setErr(e.message); }
  }
  return (<div className="auth"><div className="brand"><h1>PathSkillForge</h1><p>Your Personal Career & Learning Mentor</p></div>
    <form className="card" onSubmit={submit}><h3>{mode === "login" ? "Welcome Back" : "Create Account"}</h3>
      {mode === "register" && <input placeholder="Full name" onChange={set("name")} required />}
      <input type="email" placeholder="Email" onChange={set("email")} required />
      <input type="password" placeholder="Password" onChange={set("password")} required />
      {mode === "register" && <input type="password" placeholder="Confirm Password" onChange={set("confirm")} required />}
      {err && <p className="err">{err}</p>}
      <button>{mode === "login" ? "Login" : "Sign Up"}</button>
      {mode === "login" ? <p>No account? <Link to="/register">Sign up</Link></p> : <p>Already have an account? <Link to="/login">Login</Link></p>}
    </form></div>);
}
export const Login = () => <Form mode="login" />; export const Register = () => <Form mode="register" />;
