import mongoose from "mongoose";
const { Schema, model } = mongoose;
const id = { type: Schema.Types.ObjectId };
export const User = model("User", new Schema({
  name: String, email: { type: String, unique: true, required: true }, password: String,
  role: { type: String, default: "learner" }, course: String, year: String, theme: { type: String, default: "light" },
}, { timestamps: true }));
export const Document = model("Document", new Schema({
  user: { ...id, ref: "User" }, title: String, filename: String, size: Number, text: String, pages: Number,
}, { timestamps: true }));
export const Chat = model("Chat", new Schema({
  user: id, document: id, role: String, content: String,
}, { timestamps: true }));
export const Flashcard = model("Flashcard", new Schema({
  user: id, document: id, question: String, answer: String, favorite: { type: Boolean, default: false },
}, { timestamps: true }));
export const Quiz = model("Quiz", new Schema({
  user: id, document: id, title: String, difficulty: String,
  questions: [{ question: String, options: [String], correct: Number, explanation: String }],
  answers: [Number], score: Number, completed: { type: Boolean, default: false },
}, { timestamps: true }));
export const Activity = model("Activity", new Schema({ user: id, type: String, description: String }, { timestamps: true }));
export const log = (user, type, description) => Activity.create({ user, type, description });
