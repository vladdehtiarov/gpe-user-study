# GPE User Study

A web-based user study for comparing explanation methods in credit decision scenarios.

## 🎯 Purpose

This study compares three AI explanation methods:
- **GPE (Greedy-Prune-Explain)** - Novel rule-based method
- **LIME** - Feature importance-based explanations
- **Anchors** - High-precision rule-based explanations

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────────────┐
│   FRONTEND      │ ◄─────► │      BACKEND             │
│   (Next.js)     │   API   │   (FastAPI + Python)     │
│                 │         │                          │
│   - Study flow  │         │   - Trained ML Model     │
│   - Survey      │         │   - GPE Framework        │
│   - Ratings     │         │   - LIME                 │
└─────────────────┘         └──────────────────────────┘
```

## 🚀 Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at http://localhost:3000

## 📦 Deployment (Render)

### Backend (Web Service)

1. Create new Web Service on Render
2. Connect to GitHub repository
3. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Static Site)

1. Create new Static Site on Render
2. Connect to GitHub repository
3. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `out`
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL

## 📊 Study Flow

1. **Welcome** - Consent form
2. **Scenarios** (×3) - View credit application and decision
3. **Explanations** - Compare 3 methods (randomized order)
4. **Ratings** - Rate each explanation (clarity, trust, etc.)
5. **Final Survey** - Rank preferences, provide feedback
6. **Thank You** - Completion

## 🔒 Data Collected

- Explanation ratings (1-7 Likert scale)
- Method preferences
- Time spent on explanations
- Optional demographics

All data is anonymous and used for academic research only.

## 👤 Author

**Vladyslav Dehtiarov**
- Sumy State University
- PhD Research on Explainable AI

## 📜 License

MIT License

