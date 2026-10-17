import { useEffect, useState } from "react"; import { useSearchParams } from "react-router-dom"; import api from "../api";
export default function Flashcards() {
  const [sp] = useSearchParams(); const [cards, setCards] = useState([]); const [fav, setFav] = useState(false); const [flip, setFlip] = useState({});
  useEffect(() => { const p = {}; if (sp.get("document")) p.document = sp.get("document"); if (fav) p.favorite = 1;
    api.get("/flashcards", { params: p }).then((r) => setCards(r.data)); }, [fav, sp]);
  const toggle = async (c) => { const { data } = await api.patch(`/flashcards/${c._id}/favorite`); setCards(cards.map((x) => x._id === c._id ? data : x)); };
  return (<><h1>Flashcards</h1><label><input type="checkbox" checked={fav} onChange={(e) => setFav(e.target.checked)} /> Favorites only</label>
    {!cards.length && <p>No flashcards yet. Open a document and generate some.</p>}
    <div className="grid">{cards.map((c) => <div key={c._id} className={"card flash " + (flip[c._id] ? "back" : "")} onClick={() => setFlip({ ...flip, [c._id]: !flip[c._id] })}>
      <button className="star ghost" onClick={(e) => { e.stopPropagation(); toggle(c); }}>{c.favorite ? "★" : "☆"}</button>
      <small>{flip[c._id] ? "Answer" : "Question"}</small><p>{flip[c._id] ? c.answer : c.question}</p></div>)}</div></>);
}
