from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
from io import StringIO
import os
from dotenv import load_dotenv

# Load environment (.env file)
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

app = FastAPI(title="Cash Flow Insights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeResponse(BaseModel):
    monthly: List[Dict[str, Any]]
    weekly: List[Dict[str, Any]]
    seasonality: List[Dict[str, Any]]
    kpis: Dict[str, Any]
    callouts: Dict[str, Any]
    recs: Optional[str] = None


# ---------- Helpers ----------

def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parse uploaded CSV into cleaned DataFrame."""
    s = file_bytes.decode("utf-8", errors="ignore")
    df = pd.read_csv(StringIO(s))

    # Normalize headers
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.rename(columns={
        "cash inflows": "Inflows",
        "cash outflows": "Outflows",
        "balance": "Balance",
        "date": "Date",
    })

    # Parse dates
    df["Date"] = df["Date"].astype(str).str.strip()
    df["Date"] = pd.to_datetime(df["Date"], format="%Y-%m-%d", errors="coerce")

    # Clean numeric columns
    for col in ["Inflows", "Outflows", "Balance"]:
        df[col] = (
            df[col]
            .astype(str)
            .str.replace(r"[^0-9.\-]", "", regex=True)
            .replace("", "0")
            .astype(float)
        )

    df = df.dropna(subset=["Date"]).sort_values("Date").reset_index(drop=True)
    df["Net"] = df["Inflows"] - df["Outflows"]
    return df


def monthly_agg(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate weekly → monthly totals."""
    if df.empty:
        return pd.DataFrame(columns=["YM", "Year", "Month", "Inflows", "Outflows", "Net", "EndBalance"])

    df["Year"] = df["Date"].dt.year
    df["Month"] = df["Date"].dt.month
    grp = df.groupby(["Year", "Month"], as_index=False).agg({
        "Inflows": "sum",
        "Outflows": "sum",
        "Net": "sum",
        "Balance": "last"
    }).rename(columns={"Balance": "EndBalance"})

    grp["YM"] = grp["Year"].astype(str) + "-" + grp["Month"].astype(str).str.zfill(2)
    return grp


def seasonality(dfm: pd.DataFrame) -> pd.DataFrame:
    """Average inflows/outflows by calendar month (for seasonality)."""
    if dfm.empty:
        return pd.DataFrame(columns=["Month", "AvgInflows", "AvgOutflows"])

    seas = dfm.groupby("Month", as_index=False).agg({
        "Inflows": "mean",
        "Outflows": "mean"
    }).rename(columns={"Inflows": "AvgInflows", "Outflows": "AvgOutflows"})
    return seas


def runway_kpis(dfm: pd.DataFrame) -> Dict[str, Any]:
    k = {"runway_months": None, "avg_net_last3": None, "last_balance": None}
    if dfm is None or dfm.empty:
        return k

    last_balance = float(dfm.iloc[-1]["EndBalance"])
    last3 = dfm.tail(3)
    avg_net = float(last3["Net"].mean()) if len(last3) > 0 else 0.0

    if avg_net > 0:
        runway = "Growing (∞)"
    elif avg_net < 0:
        months_left = last_balance / abs(avg_net) if avg_net != 0 else None
        runway = round(months_left, 1)
    else:
        runway = "Stable"

    k.update({
        "runway_months": runway,
        "avg_net_last3": avg_net,
        "last_balance": last_balance
    })
    return k

    last_balance = float(dfm.iloc[-1]["EndBalance"])
    last3 = dfm.tail(3)
    avg_net = float(last3["Net"].mean()) if len(last3) > 0 else 0.0

def build_callouts(dfm: pd.DataFrame, dfw: pd.DataFrame, threshold: float) -> Dict[str, Any]:
    """
    Create callouts for the frontend:
      - healthy_months: months with Net >= 0
      - concerning_months: months with Net < 0
      - risk_months: months where Net < threshold OR EndBalance < threshold
      - weekly_breaches: weeks where Net < threshold (for the weekly chart callout)
    threshold is the user-provided *net change* cutoff (can be negative, e.g., -5000).
    """
    callouts: Dict[str, Any] = {
        "risk_months": [],
        "healthy_months": [],
        "concerning_months": [],
        "weekly_breaches": [],
    }

    if dfm is None or dfm.empty:
        return callouts

    # Tag healthy vs. concerning months
    for _, r in dfm.iterrows():
        item = {"month": r["YM"], "net": float(r["Net"])}
        if r["Net"] >= 0:
            callouts["healthy_months"].append(item)
        else:
            callouts["concerning_months"].append(item)

    # Risk months: (1) Net below threshold OR (2) Ending balance below threshold
    # Example: with threshold = -5000, a month with Net = -7290 is a risk month.
    risk_rows = dfm[(dfm["Net"] < threshold) | (dfm["EndBalance"] < threshold)]
    for _, r in risk_rows.iterrows():
        callouts["risk_months"].append({
            "month": r["YM"],
            "net": float(r["Net"]),
            "end_balance": float(r["EndBalance"]),
        })

    # Weekly breaches: any week where Net < threshold
    if dfw is not None and not dfw.empty:
        weekly_breaches = dfw[dfw["Net"] < threshold]
        for _, r in weekly_breaches.iterrows():
            callouts["weekly_breaches"].append({
                "date": pd.to_datetime(r["Date"]).strftime("%Y-%m-%d"),
                "net": float(r["Net"]),
            })

    return callouts

async def get_ai_recs(dfm: pd.DataFrame, callouts: Dict[str, Any]) -> Optional[str]:
    """
    Generate AI recommendations based on monthly data + callouts.
    Requires OPENAI_API_KEY in your environment (.env).
    Returns a Markdown string with actionable recs, or None if disabled.
    """

    MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "openai").lower()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

    # No keys at all → fallback
    if MODEL_PROVIDER == "openai" and not OPENAI_API_KEY:
        return None
    if MODEL_PROVIDER == "anthropic" and not ANTHROPIC_API_KEY:
        return None

    try:

        # Build summary for AI prompt
        month_names = {
            1: "January", 2: "February", 3: "March", 4: "April",
            5: "May", 6: "June", 7: "July", 8: "August",
            9: "September", 10: "October", 11: "November", 12: "December"
        }
        rows = []
        for _, r in dfm.iterrows():
            rows.append(
                f"{month_names.get(r['Month'], r['Month'])}: "
                f"inflows=${r['Inflows']:,.0f}, "
                f"outflows=${r['Outflows']:,.0f}, "
                f"net=${r['Net']:,.0f}, "
                f"end_balance=${r['EndBalance']:,.0f}"
            )
        monthly_summary = "\n".join(rows)

        risk_lines = ", ".join(
            [f"{month_names.get(int(x['month'].split('-')[1]), x['month'])} "
             f"(net ${x['net']:,.0f}, end ${x['end_balance']:,.0f})"
             for x in callouts.get("risk_months", [])]
        ) or "none"

        prompt = (
        "You are a helpful financial coach for small business owners. "
        "Write advice in plain, everyday language — no technical or business jargon. "
        "Always explain things as if the person is new to managing cash. "
        "Talk about each month as 'next January', 'next June', etc. (do not mention the year explicitly).\n\n"
        f"Here is the monthly summary:\n{monthly_summary}\n\n"
        f"Risk months: {risk_lines}.\n\n"
        "Now write 3–6 short, clear, and encouraging tips. "
        "Each tip should say the month it applies to (e.g., 'In next June...'). "
        "Focus on simple ideas like saving money, being careful with spending, "
        "or setting aside cash during good months."
        )

        # 🔹 Branch by provider
        if MODEL_PROVIDER == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=350,
            )
            return resp.choices[0].message.content

        elif MODEL_PROVIDER == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            resp = client.messages.create(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest"),
                max_tokens=350,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text

        else:
            return None

    except Exception as e:
        print("AI error:", e)
        return None

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...), threshold: float = Form(0.0)):
    raw = await file.read()
    df = parse_csv(raw)

    dfm = monthly_agg(df)
    seas = seasonality(dfm)
    kpis = runway_kpis(dfm)
    callouts = build_callouts(dfm, df, threshold)

    ai_md = await get_ai_recs(dfm, callouts)

    return AnalyzeResponse(
        monthly=dfm.to_dict(orient="records"),
        weekly=df.assign(Date=df["Date"].dt.strftime("%Y-%m-%d"),Balance=df["Balance"]).to_dict(orient="records"),
        seasonality=seas.to_dict(orient="records"),
        kpis=kpis,
        callouts=callouts,
        recs=ai_md,
    )
@app.get("/")
def root():
    return {"ok": True, "service": "Cash Flow Insights API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
