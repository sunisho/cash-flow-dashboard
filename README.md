📊 Cashflow Dashboard

A web-based, mobile-optimized financial dashboard for small business owners.
Uploads weekly cashflow data (CSV) and provides clear charts, risk alerts, and simple recommendations for improving financial health.

🚀 Features

CSV Upload: Weekly data with Date, Inflows, Outflows, Balance.

Automatic Aggregation: Calculates monthly totals and net change.

Charts:

Monthly inflows vs outflows (with net line + highlights for negative months).

Weekly net change (with threshold line + breach list).

Balance trend over time.

Seasonality (average by month, shaded for risky patterns).

Risk Detection: Flags months and weeks where cashflow dips below threshold.

AI Recommendations: Simple, plain-English tips for managing cash better.

Mobile-First UI: Built with React and Recharts.

🛠 Tech Stack

Frontend: React (Vite) + Recharts + Axios

Backend: FastAPI (Python) + Pandas

AI: OpenAI GPT (for recommendations)

📂 Project Structure
cashflow-dashboard/
├── backend/           # FastAPI app (Python)
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── frontend/          # React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MonthlyChart.jsx
│   │   │   ├── WeeklyChart.jsx
│   │   │   ├── SeasonalityChart.jsx
│   │   │   └── ...
│   └── package.json
└── README.md

📥 Sample CSV Format
Date,Inflows,Outflows,Balance
2024-01-07,10000,8000,2000
2024-01-14,5000,7000,0
2024-01-21,12000,4000,8000


Each row = 1 week.

Balance is cumulative.

▶️ Running Locally
1. Backend (FastAPI)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000


Backend runs at: http://127.0.0.1:8000

2. Frontend (React)
cd frontend
npm install
npm run dev


Frontend runs at: http://127.0.0.1:5173

⚡ Deployment

Frontend: Vercel / Netlify

Backend: Render / Railway / Fly.io

Provide API_BASE_URL in frontend to point to deployed backend.

🙌 Credits

Built with ❤️ using React, FastAPI, and OpenAI.