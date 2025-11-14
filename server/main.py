from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd
import tempfile
import xml.etree.ElementTree as ET
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from apple_health_parser.utils.parser import Parser

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_col(df: pd.DataFrame, *cands: str) -> Optional[str]:
    for c in cands:
        if c in df.columns:
            return c
    return None


def _unwrap_value_series(df: pd.DataFrame) -> pd.DataFrame:
    if "value" not in df.columns:
        df["_value_raw"] = pd.NA
        df["_value_num"] = pd.NA
        df["_value_str"] = pd.NA
        return df

    def _unwrap(v):
        try:
            return v.value if hasattr(v, "value") else v
        except Exception:
            return v

    df["_value_raw"] = df["value"].map(_unwrap)
    df["_value_num"] = pd.to_numeric(df["_value_raw"], errors="coerce")
    df["_value_str"] = df["_value_raw"].astype(str)
    return df


def _df_for(parser: Parser, flag: str) -> Optional[pd.DataFrame]:
    try:
        parsed = parser.get_flag_records(flag=flag)  # -> ParsedData
        df = parsed.records.copy()
        if df.empty:
            return None

        # dates -> tz-aware UTC
        sd = _safe_col(df, "start_date", "startDate")
        ed = _safe_col(df, "end_date", "endDate")
        if sd:
            df[sd] = pd.to_datetime(df[sd], errors="coerce", utc=True)
        if ed:
            df[ed] = pd.to_datetime(df[ed], errors="coerce", utc=True)

        df = _unwrap_value_series(df)

        df["_sd"] = df[sd] if sd else pd.NaT
        df["_ed"] = df[ed] if ed else pd.NaT
        return df
    except Exception:
        return None


def _period_key(series: pd.Series, freq: str) -> pd.Series:
    return series.dt.tz_convert("UTC").dt.to_period(freq)


def _scan_records_once(xml_file: str) -> Dict[str, Any]:
    # Aggregators
    steps_total = 0
    steps_daily = defaultdict(float)  # day -> steps
    steps_monthly = defaultdict(float)

    energy_total = 0.0
    energy_daily = defaultdict(float)

    hr_sum = 0.0
    hr_count = 0
    rhr_sum = 0.0
    rhr_count = 0

    sleep_total_hours = 0.0
    sleep_monthly_hours = defaultdict(float)
    sleep_night_dates = set()  # YYYY-MM-DD strings

    mindful_total_min = 0.0
    mindful_sessions = 0

    def _parse_dt(s: Optional[str]) -> Optional[datetime]:
        if not s:
            return None
        # Apple format: "YYYY-MM-DD HH:mm:ss +HHMM"
        try:
            return datetime.strptime(s, "%Y-%m-%d %H:%M:%S %z")
        except Exception:
            # Try ISO-ish fallback
            try:
                return datetime.fromisoformat(s.replace(" ", "T"))
            except Exception:
                return None

    asleep_values = {
        "HKCategoryValueSleepAnalysisAsleep",
        "HKCategoryValueSleepAnalysisAsleepCore",
        "HKCategoryValueSleepAnalysisAsleepDeep",
        "HKCategoryValueSleepAnalysisAsleepREM",
        "HKCategoryValueSleepAnalysisAsleepUnspecified",
        "1",
    }

    # Iterate
    for event, elem in ET.iterparse(xml_file, events=("start",)):
        if elem.tag != "Record":
            continue

        rtype = elem.attrib.get("type")
        if not rtype:
            elem.clear()
            continue

        # Common attrs
        start = _parse_dt(elem.attrib.get("startDate"))
        end = _parse_dt(elem.attrib.get("endDate"))
        val = elem.attrib.get("value")

        # Steps
        if rtype == "HKQuantityTypeIdentifierStepCount":
            try:
                v = float(val) if val is not None else 0.0
            except Exception:
                v = 0.0
            if start and v > 0:
                steps_total += v
                day = start.astimezone(timezone.utc).strftime("%Y-%m-%d")
                month = start.astimezone(timezone.utc).strftime("%Y-%m")
                steps_daily[day] += v
                steps_monthly[month] += v
            elem.clear()
            continue

        # Active energy
        if rtype == "HKQuantityTypeIdentifierActiveEnergyBurned":
            try:
                v = float(val) if val is not None else 0.0
            except Exception:
                v = 0.0
            if start and v > 0:
                energy_total += v
                day = start.astimezone(timezone.utc).strftime("%Y-%m-%d")
                energy_daily[day] += v
            elem.clear()
            continue

        # Heart rate / Resting HR
        if rtype == "HKQuantityTypeIdentifierHeartRate":
            try:
                v = float(val) if val is not None else 0.0
            except Exception:
                v = 0.0
            if v > 0:
                hr_sum += v
                hr_count += 1
            elem.clear()
            continue

        if rtype == "HKQuantityTypeIdentifierRestingHeartRate":
            try:
                v = float(val) if val is not None else 0.0
            except Exception:
                v = 0.0
            if v > 0:
                rhr_sum += v
                rhr_count += 1
            elem.clear()
            continue

        # Sleep (asleep segments only)
        if rtype == "HKCategoryTypeIdentifierSleepAnalysis":
            if start and end and end > start:
                raw = val or ""
                if raw in asleep_values or "Asleep" in raw:
                    hours = (end - start).total_seconds() / 3600.0
                    if hours > 0:
                        sleep_total_hours += hours
                        month = start.astimezone(timezone.utc).strftime("%Y-%m")
                        day = start.astimezone(timezone.utc).strftime("%Y-%m-%d")
                        sleep_monthly_hours[month] += hours
                        sleep_night_dates.add(day)
            elem.clear()
            continue

        # Mindful session
        if rtype == "HKCategoryTypeIdentifierMindfulSession":
            if start and end and end > start:
                minutes = (end - start).total_seconds() / 60.0
                if minutes > 0:
                    mindful_total_min += minutes
                    mindful_sessions += 1
            elem.clear()
            continue

        # discard any other record
        elem.clear()

    # Build result
    steps_days = max(1, len(steps_daily))
    energy_days = max(1, len(energy_daily))
    sleep_nights = max(1, len(sleep_night_dates))

    steps_monthly_sorted = sorted(steps_monthly.items())
    best_steps_month = ""
    if steps_monthly:
        best_steps_month = max(steps_monthly, key=lambda k: steps_monthly[k])  # "YYYY-MM"

    best_sleep_month = ""
    if sleep_monthly_hours:
        best_sleep_month = max(sleep_monthly_hours, key=lambda k: sleep_monthly_hours[k])

    return {
        "steps": {
            "total": int(round(steps_total)),
            "average": int(round(steps_total / steps_days)),
            "bestMonth": best_steps_month,
            "monthlyData": [{"month": m, "value": int(round(v))} for m, v in steps_monthly_sorted],
        },
        "energy": {
            "total": float(energy_total),
            "average": int(round(energy_total / energy_days)),
        },
        "heart": {
            "avg": int(round(hr_sum / hr_count)) if hr_count else 0,
            "rest": int(round(rhr_sum / rhr_count)) if rhr_count else 0,
        },
        "sleep": {
            "totalHours": round(sleep_total_hours, 2),
            "averageHours": round(sleep_total_hours / sleep_nights, 2) if sleep_total_hours else 0.0,
            "bestMonth": best_sleep_month,
        },
        "mindful": {
            "total": round(minful := mindful_total_min, 2) if (minful := mindful_total_min) else 0.0,
            "sessions": int(mindful_sessions),
        },
    }


@app.post("/parse")
async def parse(file: UploadFile = File(...)) -> Dict[str, Any]:
    with tempfile.TemporaryDirectory() as td:
        zip_path = Path(td) / (file.filename or "export.zip")
        zip_path.write_bytes(await file.read())

        parser = Parser(export_file=str(zip_path), overwrite=True)

        # Steps
        steps_total = 0
        steps_avg = 0
        steps_best_month = ""
        steps_monthly: list[dict[str, Any]] = []
        daily_step_days = 0

        steps_df = _df_for(parser, "HKQuantityTypeIdentifierStepCount")
        if steps_df is not None:
            steps_total = int(steps_df["_value_num"].fillna(0).sum())
            if steps_total > 0:
                daily = steps_df.groupby(_period_key(steps_df["_sd"], "D"))["_value_num"].sum()
                daily_step_days = int(daily.size) or 1
                steps_avg = int(round(steps_total / daily_step_days))
                monthly = (
                    steps_df.groupby(_period_key(steps_df["_sd"], "M"))["_value_num"].sum().sort_index()
                )
                steps_monthly = [{"month": str(p), "value": int(v)} for p, v in monthly.items()]
                if not monthly.empty:
                    steps_best_month = str(monthly.idxmax())

        # Active energy
        energy_total = 0.0
        energy_avg = 0
        energy_df = _df_for(parser, "HKQuantityTypeIdentifierActiveEnergyBurned")
        if energy_df is not None:
            energy_total = float(energy_df["_value_num"].fillna(0).sum())
            if energy_total > 0:
                energy_daily = energy_df.groupby(_period_key(energy_df["_sd"], "D"))["_value_num"].sum()
                energy_days = int(energy_daily.size) or (daily_step_days or 1)
                energy_avg = int(round(energy_total / energy_days))

        # Heart rate
        hr_avg = 0
        hr_df = _df_for(parser, "HKQuantityTypeIdentifierHeartRate")
        if hr_df is not None:
            there = hr_df["_value_num"].dropna()
            if len(there):
                hr_avg = int(round(there.mean()))

        # Resting HR
        rhr_avg = 0
        rhr_df = _df_for(parser, "HKQuantityTypeIdentifierRestingHeartRate")
        if rhr_df is not None:
            there = rhr_df["_value_num"].dropna()
            if len(there):
                rhr_avg = int(round(there.mean()))

        # Sleep
        sleep_total_h = 0.0
        sleep_avg_h = 0.0
        sleep_best_month = ""
        sleep_df = _df_for(parser, "HKCategoryTypeIdentifierSleepAnalysis")
        if sleep_df is not None and not sleep_df.empty:
            asleep_values = {
                "HKCategoryValueSleepAnalysisAsleep",
                "HKCategoryValueSleepAnalysisAsleepCore",
                "HKCategoryValueSleepAnalysisAsleepDeep",
                "HKCategoryValueSleepAnalysisAsleepREM",
                "HKCategoryValueSleepAnalysisAsleepUnspecified",
                "1",
            }
            asleep = sleep_df["_value_raw"].isin(asleep_values) | sleep_df["_value_str"].str.contains(
                "Asleep", case=False, na=False
            )
            sleep_asleep = sleep_df[asleep].copy()
            if not sleep_asleep.empty:
                sleep_asleep["hours"] = (
                    (sleep_asleep["_ed"] - sleep_asleep["_sd"]).dt.total_seconds().div(3600).clip(lower=0)
                )
                sleep_total_h = float(sleep_asleep["hours"].sum())
                if sleep_total_h > 0:
                    sleep_days = int(sleep_asleep["_sd"].dt.tz_convert("UTC").dt.date.nunique()) or 1
                    sleep_avg_h = round(sleep_total_h / sleep_days, 2)
                    monthly_sleep = (
                        sleep_asleep.groupby(_period_key(sleep_asleep["_sd"], "M"))["hours"].sum().sort_index()
                    )
                    if not monthly_sleep.empty:
                        sleep_best_month = str(monthly_sleep.idxmax())

        # Mindful
        mindful_total_min = 0.0
        mindful_sessions = 0
        mindful_df = _df_for(parser, "HKCategoryTypeIdentifierMindfulSession")
        if mindful_df is not None and not mindful_df.empty:
            mindful_df["minutes"] = (
                (mindful_df["_ed"] - mindful_df["_sd"]).dt.total_seconds().div(60).clip(lower=0)
            )
            mindful_total_min = float(mindful_df["minutes"].sum())
            mindful_sessions = int(mindful_df.shape[0])

        need_steps = steps_total == 0
        need_energy = energy_total == 0
        need_hr = hr_avg == 0 and rhr_avg == 0
        need_sleep = sleep_total_h == 0
        need_mindful = mindful_total_min == 0

        if any([need_steps, need_energy, need_hr, need_sleep, need_mindful]):
            scanned = _scan_records_once(parser.xml_file)

            if need_steps:
                steps_total = scanned["steps"]["total"]
                steps_avg = scanned["steps"]["average"]
                steps_best_month = scanned["steps"]["bestMonth"]
                steps_monthly = scanned["steps"]["monthlyData"]

            if need_energy:
                energy_total = scanned["energy"]["total"]
                energy_avg = scanned["energy"]["average"]

            if need_hr:
                hr_avg = scanned["heart"]["avg"]
                rhr_avg = scanned["heart"]["rest"]

            if need_sleep:
                sleep_total_h = scanned["sleep"]["totalHours"]
                sleep_avg_h = scanned["sleep"]["averageHours"]
                sleep_best_month = scanned["sleep"]["bestMonth"]

            if need_mindful:
                mindful_total_min = scanned["mindful"]["total"]
                mindful_sessions = scanned["mindful"]["sessions"]

        # Workouts
        root = ET.parse(parser.xml_file).getroot()
        workout_nodes = root.findall(".//Workout")
        wk_count = len(workout_nodes)
        wk_types = Counter()
        wk_total_minutes = 0.0
        for w in workout_nodes:
            kind = (w.attrib.get("workoutActivityType") or "Other").replace("HKWorkoutActivityType", "")
            wk_types[kind] += 1
            dur = w.attrib.get("duration")
            unit = (w.attrib.get("durationUnit") or "").lower()
            try:
                d = float(dur) if dur is not None else 0.0
                if unit in {"hr", "hour", "hours"}:
                    d *= 60.0
                wk_total_minutes += d
            except ValueError:
                pass

        steps_km = round(steps_total * 0.0008, 1)  # ~0.8 m/step
        fun_fact = f"You walked ~{steps_km} km – roughly a city-to-city trek!"

        metrics = {
            "steps": {
                "total": int(steps_total),
                "average": int(steps_avg),
                "bestMonth": steps_best_month,  # plain "YYYY-MM"
                "monthlyData": steps_monthly,
            },
            "workouts": {
                "total": int(wk_count),
                "types": dict(wk_types),
                "totalMinutes": int(round(wk_total_minutes)),
            },
            "sleep": {
                "averageHours": float(sleep_avg_h),
                "totalHours": round(float(sleep_total_h), 2),
                "bestMonth": sleep_best_month,  # plain "YYYY-MM"
            },
            "heartRate": {
                "average": int(hr_avg),
                "resting": int(rhr_avg),
            },
            "activeEnergy": {
                "total": round(float(energy_total), 2),
                "average": int(energy_avg),
            },
            "mindfulMinutes": {
                "total": round(float(mindful_total_min), 2),
                "sessions": int(mindful_sessions),
            },
            "insights": {
                "topAchievement": (f"{steps_best_month} was your steps peak!") if steps_best_month else "",
                "funFact": fun_fact,
                "yearComparison": f"You completed {wk_count} workout{'s' if wk_count != 1 else ''}!",
            },
        }
        return metrics
