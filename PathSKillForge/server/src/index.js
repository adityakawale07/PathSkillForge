import "dotenv/config";
import express from "express"; import cors from "cors"; import mongoose from "mongoose";
import multer from "multer"; import fs from "fs"; import path from "path"; import bcrypt from "bcryptjs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { User, Document, Chat, Flashcard, Quiz, Activity, log } from "./models.js";
import { sign, protect, admin } from "./auth.js";
import { ask, askJSON } from "./gemini.js";

const app = express(); app.use(cors()); app.use(express.json());
fs.mkdirSync("uploads", { recursive: true });
const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, f, cb) => cb(null, f.mimetype === "application/pdf") });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ message: e.message || "Server error" }); });
const myDoc = async (req) => { const d = await Document.findOne({ _id: req.params.id, user: req.user.id }); if (!d) throw new Error("Document not found"); return d; };
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, course: u.course, year: u.year, theme: u.theme });

// ---- Auth
app.post("/api/auth/register", wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || password.length < 6) return res.status(400).json({ message: "Email and 6+ char password required" });
  if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.json({ token: sign(u), user: pub(u) });
}));
app.post("/api/auth/login", wrap(async (req, res) => {
  const u = await User.findOne({ email: req.body.email });
  if (!u || !(await bcrypt.compare(req.body.password || "", u.password))) return res.status(400).json({ message: "Invalid email or password" });
  res.json({ token: sign(u), user: pub(u) });
}));
app.get("/api/me", protect, wrap(async (req, res) => res.json(pub(await User.findById(req.user.id)))));
app.put("/api/me", protect, wrap(async (req, res) => {
  const { name, course, year, theme } = req.body;
  res.json(pub(await User.findByIdAndUpdate(req.user.id, { name, course, year, theme }, { new: true })));
}));
app.put("/api/me/password", protect, wrap(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!(await bcrypt.compare(req.body.current || "", u.password))) return res.status(400).json({ message: "Current password is wrong" });
  u.password = await bcrypt.hash(req.body.next, 10); await u.save(); res.json({ ok: true });
}));

// ---- Documents
app.post("/api/documents", protect, upload.single("file"), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Please upload a PDF (max 10 MB)" });
  const parsed = await pdf(fs.readFileSync(req.file.path));
  const d = await Document.create({ user: req.user.id, title: req.file.originalname, filename: req.file.filename,
    size: req.file.size, text: parsed.text, pages: parsed.numpages });
  await log(req.user.id, "upload", `Uploaded ${d.title}`);
  res.json({ _id: d._id, title: d.title, size: d.size, pages: d.pages, createdAt: d.createdAt });
}));
app.get("/api/documents", protect, wrap(async (req, res) =>
  res.json(await Document.find({ user: req.user.id }).select("-text").sort("-createdAt"))));
app.get("/api/documents/:id", protect, wrap(async (req, res) => { const d = await myDoc(req); d.text = undefined; res.json(d); }));
app.get("/api/documents/:id/file", protect, wrap(async (req, res) => {
  const d = await myDoc(req); res.type("application/pdf"); res.sendFile(path.resolve("uploads", d.filename));
}));
app.delete("/api/documents/:id", protect, wrap(async (req, res) => {
  const d = await myDoc(req); fs.rmSync(path.resolve("uploads", d.filename), { force: true });
  await Promise.all([d.deleteOne(), Chat.deleteMany({ document: d._id }), Flashcard.deleteMany({ document: d._id }), Quiz.deleteMany({ document: d._id })]);
  res.json({ ok: true });
}));

// ---- AI tools
app.get("/api/documents/:id/chat", protect, wrap(async (req, res) =>
  res.json(await Chat.find({ document: req.params.id, user: req.user.id }).sort("createdAt"))));
app.post("/api/documents/:id/chat", protect, wrap(async (req, res) => {
  const d = await myDoc(req);
  const answer = await ask(d.text, `Answer the student's question using only the material above. If the answer is not in it, say so.\nQuestion: ${req.body.message}`);
  await Chat.create({ user: req.user.id, document: d._id, role: "user", content: req.body.message });
  const a = await Chat.create({ user: req.user.id, document: d._id, role: "assistant", content: answer });
  res.json(a);
}));
app.post("/api/documents/:id/summary", protect, wrap(async (req, res) => {
  const d = await myDoc(req);
  const summary = await ask(d.text, "Write a clear study summary with headings and bullet points of the key topics.");
  await log(req.user.id, "summary", `Generated summary for ${d.title}`); res.json({ summary });
}));
app.post("/api/documents/:id/explain", protect, wrap(async (req, res) => {
  const d = await myDoc(req);
  res.json({ explanation: await ask(d.text, `Explain the topic "${req.body.topic}" simply for a student, with an example.`) });
}));
app.post("/api/documents/:id/flashcards", protect, wrap(async (req, res) => {
  const d = await myDoc(req); const n = Math.min(+req.body.count || 10, 30);
  const cards = await askJSON(d.text, `Create ${n} flashcards as a JSON array of {"question": string, "answer": string}.`);
  const saved = await Flashcard.insertMany(cards.map((c) => ({ ...c, user: req.user.id, document: d._id })));
  await log(req.user.id, "flashcards", `Created ${saved.length} flashcards from ${d.title}`); res.json(saved);
}));
app.get("/api/flashcards", protect, wrap(async (req, res) => {
  const q = { user: req.user.id }; if (req.query.document) q.document = req.query.document; if (req.query.favorite) q.favorite = true;
  res.json(await Flashcard.find(q).sort("-createdAt"));
}));
app.patch("/api/flashcards/:id/favorite", protect, wrap(async (req, res) => {
  const c = await Flashcard.findOne({ _id: req.params.id, user: req.user.id }); c.favorite = !c.favorite; await c.save(); res.json(c);
}));
app.post("/api/documents/:id/quiz", protect, wrap(async (req, res) => {
  const d = await myDoc(req); const n = Math.min(+req.body.count || 5, 20); const difficulty = req.body.difficulty || "medium";
  const questions = await askJSON(d.text, `Create ${n} ${difficulty} multiple-choice questions as a JSON array of {"question": string, "options": [4 strings], "correct": index 0-3, "explanation": string}.`);
  const quiz = await Quiz.create({ user: req.user.id, document: d._id, title: `${d.title} quiz`, difficulty, questions });
  res.json(quiz);
}));
app.get("/api/quizzes", protect, wrap(async (req, res) => res.json(await Quiz.find({ user: req.user.id }).sort("-createdAt"))));
app.get("/api/quizzes/:id", protect, wrap(async (req, res) => res.json(await Quiz.findOne({ _id: req.params.id, user: req.user.id }))));
app.post("/api/quizzes/:id/submit", protect, wrap(async (req, res) => {
  const q = await Quiz.findOne({ _id: req.params.id, user: req.user.id });
  q.answers = req.body.answers; q.score = q.questions.filter((x, i) => x.correct === q.answers[i]).length; q.completed = true; await q.save();
  await log(req.user.id, "quiz", `Scored ${q.score}/${q.questions.length} on ${q.title}`); res.json(q);
}));

// ---- Dashboard & admin
app.get("/api/dashboard", protect, wrap(async (req, res) => {
  const u = req.user.id; const quizzes = await Quiz.find({ user: u, completed: true });
  const avg = quizzes.length ? Math.round(quizzes.reduce((s, q) => s + (q.score / q.questions.length) * 100, 0) / quizzes.length) : 0;
  res.json({ documents: await Document.countDocuments({ user: u }), flashcards: await Flashcard.countDocuments({ user: u }),
    favorites: await Flashcard.countDocuments({ user: u, favorite: true }), quizzes: quizzes.length, avgScore: avg,
    activity: await Activity.find({ user: u }).sort("-createdAt").limit(10) });
}));
app.get("/api/admin/users", protect, admin, wrap(async (_, res) => res.json(await User.find().select("-password"))));

mongoose.connect(process.env.MONGO_URI).then(() =>
  app.listen(process.env.PORT || 5000, () => console.log("API running on http://localhost:" + (process.env.PORT || 5000))));
