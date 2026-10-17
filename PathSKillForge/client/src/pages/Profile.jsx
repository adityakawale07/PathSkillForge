import { useEffect, useState } from "react"; import api from "../api";
export default function Profile() {
  const [u, setU] = useState(null); const [pw, setPw] = useState({}); const [msg, setMsg] = useState(""); const [users, setUsers] = useState([]);
  useEffect(() => { api.get("/me").then((r) => { setU(r.data); if (r.data.role === "admin") api.get("/admin/users").then((x) => setUsers(x.data)); }); }, []);
  if (!u) return <p>Loading...</p>;
  const set = (k) => (e) => setU({ ...u, [k]: e.target.value });
  const save = async () => { await api.put("/me", u); setMsg("Profile saved"); };
  const change = async () => { try { await api.put("/me/password", pw); setMsg("Password changed"); } catch (e) { setMsg(e.message); } };
  return (<><h1>Profile & Settings</h1>{msg && <p className="ok">{msg}</p>}
    <div className="card"><h3>Profile</h3><input value={u.name || ""} onChange={set("name")} placeholder="Name" /><input value={u.email} disabled />
      <input value={u.course || ""} onChange={set("course")} placeholder="Course" /><input value={u.year || ""} onChange={set("year")} placeholder="Year" />
      <select value={u.theme} onChange={set("theme")}><option value="light">Light</option><option value="dark">Dark</option></select><button onClick={save}>Save</button></div>
    <div className="card"><h3>Change Password</h3><input type="password" placeholder="Current" onChange={(e) => setPw({ ...pw, current: e.target.value })} />
      <input type="password" placeholder="New" onChange={(e) => setPw({ ...pw, next: e.target.value })} /><button onClick={change}>Change</button></div>
    {u.role === "admin" && <div className="card"><h3>All users (admin)</h3>{users.map((x) => <p key={x._id}>{x.name} - {x.email} ({x.role})</p>)}</div>}</>);
}
