# PathSkillForge (MERN) - AI-Powered Learning Assistant

React (Vite) + Node/Express + MongoDB + Google Gemini.

## 1. Install once
- Node.js 18+  (https://nodejs.org)
- MongoDB: easiest is a free MongoDB Atlas cluster (https://www.mongodb.com/atlas) -> copy the connection string.
- Gemini API key: https://aistudio.google.com/app/apikey

## 2. Run the backend
    cd server
    npm install
    copy .env.example .env      (mac/linux: cp .env.example .env)
    # edit .env -> MONGO_URI, JWT_SECRET, GEMINI_API_KEY
    npm run dev                 # http://localhost:5000

## 3. Run the frontend (new terminal)
    cd client
    npm install
    npm run dev                 # http://localhost:5173

