import { useEffect, useState } from "react"; import { Link } from "react-router-dom"; import api, { mb } from "../api";
export default function Documents() {
  const [docs, setDocs] = useState([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const load = () => api.get("/documents").then((r) => setDocs(r.data));
  useEffect(() => { load(); }, []);
  async function upload(e) {
    const file = e.target.files[0]; if (!file) return; setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", file);
    try { await api.post("/documents", fd); load(); } catch (e) { setErr(e.message); } setBusy(false); e.target.value = "";
  }
  async function del(id) { if (confirm("Delete this document?")) { await api.delete(`/documents/${id}`); load(); } }
  return (<><h1>My Documents</h1>
    <label className="card drop">{busy ? "Uploading..." : "Click to upload a PDF (max 10 MB)"}<input type="file" accept="application/pdf" hidden onChange={upload} /></label>
    {err && <p className="err">{err}</p>}
    <table className="card"><thead><tr><th>Name</th><th>Size</th><th>Pages</th><th>Uploaded</th><th></th></tr></thead><tbody>
      {docs.map((d) => <tr key={d._id}><td><Link to={`/documents/${d._id}`}><b>{d.title}</b></Link></td><td>{mb(d.size)}</td><td>{d.pages}</td>
        <td>{new Date(d.createdAt).toLocaleDateString()}</td><td><button className="ghost" onClick={() => del(d._id)}>Delete</button></td></tr>)}
    </tbody></table></>);
}
