from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from io import StringIO
import os
from dotenv import load_dotenv


load_dotenv()


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


app = FastAPI(title="Cash Flow Insights API")


app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_credentials=True,
allow_methods=["*"]
,allow_headers=["*"]
)


class AnalyzeResponse(BaseModel):
	monthly: List[Dict[str, Any]]
	weekly: List[Dict[str, Any]]
	seasonality: List[Dict[str, Any]]
	kpis: Dict[str, Any]
	callouts: Dict[str, Any]
	ai_recommendations: Optional[str] = None


# ---------- Helpers ----------


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    s = file_bytes.decode("utf-8", errors="ignore")
    df = pd.read_csv(StringIO(s))
    # normalize headers
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.rename(columns={
        "cash inflows": "Inflows",
        "cash outflows": "Outflows",
        "balance": "Balance",
        "date": "Date",
    })
    # clean and parse dates
    df["Date"] = df["Date"].astype(str).str.strip()
    df["Date"] = pd.to_datetime(df["Date"], format="%Y-%m-%d", errors="coerce")
    for col in ["Inflows", "Outflows", "Balance"]:
        # Clean values like "$15,000" → "15000"
        df[col] = (
            df[col]
            .astype(str)
            .str.replace(r"[^0-9.\-]", "", regex=True)
            .replace("", "0")
            .astype(float)
        )
    df = df.dropna(subset=["Date"]).sort_values("Date").reset_index(drop=True)
    df["Net"] = df["Inflows"] - df["Outflows"]
    print("HEADERS:", df.columns.tolist())
    print("FIRST 5 ROWS:")
    print(df.head().to_dict(orient="records"))
    return df




def monthly_agg(df: pd.DataFrame) -> pd.DataFrame:
	if df.empty:
		return pd.DataFrame(columns=["YM","Year","Month","Inflows","Outflows","Net","EndBalance"])
	df["Year"] = df["Date"].dt.year
	df["Month"] = df["Date"].dt.month
	return {"ok": True, "service": "Cash Flow Insights API"}

# ---------- Routes ----------

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...), threshold: float = Form(5000.0)):
    raw = await file.read()
    df = parse_csv(raw)

    # quick dummy outputs just to prove it works
    monthly = df.groupby(df["Date"].dt.to_period("M")).agg({
        "Inflows": "sum",
        "Outflows": "sum",
        "Net": "sum",
        "Balance": "last"
    }).reset_index()

    # Convert Period → string explicitly
    monthly["YM"] = monthly["Date"].astype(str)
    monthly["Date"] = monthly["Date"].astype(str)

    response = {
        "monthly": monthly.to_dict(orient="records"),
        "weekly": df.to_dict(orient="records"),
        "seasonality": [],
        "kpis": {"last_balance": float(df["Balance"].iloc[-1])},
        "callouts": {"risk_months": []},
        "ai_recommendations": None,
    }
    return response

@app.get("/")
def root():
    return {"ok": True, "service": "Cash Flow Insights API"}
