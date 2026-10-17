import { useEffect, useState } from "react"; import { useParams, useNavigate } from "react-router-dom"; import api from "../api";
export default function Reader() {
  const { id } = useParams(); const nav = useNavigate();
  const [doc, setDoc] = useState(null); const [url, setUrl] = useState(""); const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState([]); const [q, setQ] = useState(""); const [out, setOut] = useState(""); const [busy, setBusy] = useState(false);
  const [opt, setOpt] = useState({ count: 5, difficulty: "medium", topic: "" });
  useEffect(() => {
    api.get(`/documents/${id}`).then((r) => setDoc(r.data)); api.get(`/documents/${id}/chat`).then((r) => setMsgs(r.data));
    api.get(`/documents/${id}/file`, { responseType: "blob" }).then((r) => setUrl(URL.createObjectURL(r.data)));
  }, [id]);
  const run = async (fn) => { setBusy(true); setOut(""); try { await fn(); } catch (e) { setOut("Error: " + e.message); } setBusy(false); };
  const send = (e) => { e.preventDefault(); const m = q; setQ(""); setMsgs((x) => [...x, { role: "user", content: m }]);
    run(async () => { const { data } = await api.post(`/documents/${id}/chat`, { message: m }); setMsgs((x) => [...x, data]); }); };
  return (<><h1>{doc?.title}</h1><div className="reader">
    <iframe className="card" src={url} title="pdf" />
    <div className="card tools">
      <div className="tabs">{["chat", "summary", "explain", "flashcards", "quiz"].map((t) =>
        <button key={t} className={tab === t ? "" : "ghost"} onClick={() => { setTab(t); setOut(""); }}>{t}</button>)}</div>
      {tab === "chat" && <><div className="chat">{msgs.map((m, i) => <div key={i} className={"msg " + m.role}>{m.content}</div>)}{busy && <p>Thinking...</p>}</div>
        <form onSubmit={send} className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question..." required /><button disabled={busy}>Send</button></form></>}
      {tab === "summary" && <button disabled={busy} onClick={() => run(async () => setOut((await api.post(`/documents/${id}/summary`)).data.summary))}>Get Summary</button>}
      {tab === "explain" && <div className="row"><input placeholder="Topic, e.g. Classes and Objects" onChange={(e) => setOpt({ ...opt, topic: e.target.value })} />
        <button disabled={busy} onClick={() => run(async () => setOut((await api.post(`/documents/${id}/explain`, { topic: opt.topic })).data.explanation))}>Explain</button></div>}
      {(tab === "flashcards" || tab === "quiz") && <div className="row">
        <input type="number" min="1" max="20" value={opt.count} onChange={(e) => setOpt({ ...opt, count: e.target.value })} />
        {tab === "quiz" && <select onChange={(e) => setOpt({ ...opt, difficulty: e.target.value })} value={opt.difficulty}><option>easy</option><option>medium</option><option>hard</option></select>}
        <button disabled={busy} onClick={() => run(async () => {
          if (tab === "flashcards") { await api.post(`/documents/${id}/flashcards`, opt); nav(`/flashcards?document=${id}`); }
          else { const { data } = await api.post(`/documents/${id}/quiz`, opt); nav(`/quizzes/${data._id}`); } })}>Generate {tab}</button></div>}
      {busy && tab !== "chat" && <p>Working with AI...</p>}
      {out && <div className="out">{out}</div>}
    </div></div></>);
}
