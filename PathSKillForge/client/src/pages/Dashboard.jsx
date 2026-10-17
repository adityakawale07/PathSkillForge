import { useEffect, useState } from "react"; import api from "../api";
export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/dashboard").then((r) => setD(r.data)); }, []);
  if (!d) return <p>Loading...</p>;
  return (<><h1>Dashboard</h1>
    <div className="grid">{[["Documents", d.documents], ["Flashcards", d.flashcards], ["Favorites", d.favorites], ["Quizzes", d.quizzes], ["Avg score", d.avgScore + "%"]]
      .map(([l, v]) => <div className="card stat" key={l}><span>{l}</span><b>{v}</b></div>)}</div>
    <div className="card"><h3>Learning progress</h3><div className="bar"><div style={{ width: d.avgScore + "%" }} /></div></div>
    <div className="card"><h3>Recent activity</h3>{d.activity.length ? d.activity.map((a) =>
      <p key={a._id}>{a.description} <small>{new Date(a.createdAt).toLocaleString()}</small></p>) : <p>No activity yet. Upload a PDF to start.</p>}</div></>);
}
