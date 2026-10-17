// Keep broad document coverage; prioritize matching passages for specific questions.
export function selectContext(text = '', query = '', limit = 18000) {
  if (text.length <= limit) return text;
  const chunks = text.match(/[\s\S]{1,1500}/g) || [];
  const words = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  const ranked = chunks.map((chunk, index) => ({ chunk, index,
    score: words.reduce((sum, word) => sum + (chunk.toLowerCase().includes(word) ? 1 : 0), 0) }));
  const slots = Math.floor(limit / 1500);
  const chosen = new Set();
  // Reserve half the budget for evenly spaced passages, including the document's end.
  const broad = Math.ceil(slots / 2);
  for (let i = 0; i < broad; i++) chosen.add(Math.round(i * (chunks.length - 1) / Math.max(1, broad - 1)));
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  for (const item of ranked) { if (chosen.size >= slots) break; chosen.add(item.index); }
  return [...chosen].sort((a, b) => a - b).map(i => chunks[i]).join('\n\n[Excerpt]\n\n').slice(0, limit);
}
