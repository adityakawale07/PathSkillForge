import { useEffect, useState } from "react"; import { useParams, Link } from "react-router-dom"; import api from "../api";
export default function Quiz() {
  const { id } = useParams(); const [list, setList] = useState([]); const [q, setQ] = useState(null); const [i, setI] = useState(0); const [ans, setAns] = useState([]);
  useEffect(() => { if (id) api.get(`/quizzes/${id}`).then((r) => { setQ(r.data); setAns(r.data.answers || []); setI(0); }); else api.get("/quizzes").then((r) => setList(r.data)); }, [id]);
  if (!id) return (<><h1>Quizzes</h1>{!list.length && <p>No quizzes yet. Open a document and generate one.</p>}
    <table className="card"><tbody>{list.map((x) => <tr key={x._id}><td><Link to={`/quizzes/${x._id}`}>{x.title}</Link></td><td>{x.difficulty}</td>
      <td>{x.completed ? `${x.score}/${x.questions.length}` : "Not taken"}</td></tr>)}</tbody></table></>);
  if (!q) return <p>Loading...</p>;
  if (q.completed) { const pct = Math.round((q.score / q.questions.length) * 100);
    return (<><h1>Quiz Result</h1><div className="card stat"><span>You scored {q.score} out of {q.questions.length}</span><b>{pct}%</b></div>
      {q.questions.map((x, k) => <div className="card" key={k}><b>{k + 1}. {x.question}</b>
        <p className={q.answers[k] === x.correct ? "ok" : "err"}>Your answer: {x.options[q.answers[k]] ?? "—"}</p>
        <p>Correct: {x.options[x.correct]}</p><small>{x.explanation}</small></div>)}</>); }
  const x = q.questions[i];
  const submit = async () => setQ((await api.post(`/quizzes/${id}/submit`, { answers: ans })).data);
  return (<><h1>{q.title}</h1><div className="card"><small>Question {i + 1} of {q.questions.length}</small><h3>{x.question}</h3>
    {x.options.map((o, k) => <label key={k} className="opt"><input type="radio" checked={ans[i] === k} onChange={() => { const a = [...ans]; a[i] = k; setAns(a); }} /> {o}</label>)}
    <div className="row"><button className="ghost" disabled={!i} onClick={() => setI(i - 1)}>Previous</button>
      {i < q.questions.length - 1 ? <button onClick={() => setI(i + 1)}>Next</button> : <button onClick={submit}>Submit</button>}</div></div></>);
}
