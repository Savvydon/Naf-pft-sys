from typing import Dict
from .scoring_tables import SCORING

# =========================================================
# Utilities
# =========================================================

def get_points(value: float, ranges: list) -> int:
    for low, high, pts in ranges:
        if low <= value <= high:
            return pts
    return 0


def determine_age_group(age: int) -> str:
    if age <= 29:
        return "<29"
    elif age <= 39:
        return "30-39"
    elif age <= 49:
        return "40-49"
    elif age <= 59:
        return "50-59"
    return "60+"


def determine_cardio_type(age: int) -> str:
    return "JOGGING" if age <= 39 else "WALKING"


def compute_bmi(weight_kg: float, height_m: float) -> float:
    return round(weight_kg / (height_m ** 2), 2) if height_m > 0 else 0.0


def compute_ideal_weight(height_m: float, gender: str) -> float:
    height_cm = height_m * 100
    base = 50 if gender == "male" else 45.5
    return round(base + 0.91 * (height_cm - 152.4), 1)

# =========================================================
# Status evaluation
# =========================================================

def evaluate_status(value, ideal, deficit, excess, cfg_type):
    if cfg_type == "Closer to ideal":
        low, high = ideal
        if low <= value <= high:
            return "Normal"
        elif value < low:
            return "Underweight"
        return "Overweight"

    if cfg_type == "Cage-based":
        if value == 1:
            return "Excellent"
        elif value == 2:
            return "Good"
        return "Poor"

    if deficit == 0:
        return "Excellent" if excess == 0 else "Above Standard"

    ratio = deficit / ideal if ideal else 1
    if ratio <= 0.2:
        return "Good"
    elif ratio <= 0.4:
        return "Fair"
    return "Poor"

# =========================================================
# Component scoring
# =========================================================

def get_component_status(value: float, cfg: dict) -> Dict:
    points = get_points(value, cfg["ranges"])

    result = {
        "value": value,
        "points": points,
        "ideal": cfg.get("ideal"),
        "deficit": 0,
        "excess": 0,
        "status": None,
    }

    if cfg["type"] == "Cage-based":
        result["status"] = evaluate_status(value, None, 0, 0, "Cage-based")
        return result

    if cfg["type"] == "Closer to ideal":
        low, high = cfg["ideal"]
        result["deficit"] = max(0, low - value)
        result["excess"] = max(0, value - high)
        result["status"] = evaluate_status(
            value, (low, high), result["deficit"], result["excess"], cfg["type"]
        )
        return result

    ideal = cfg["ideal"]
    result["deficit"] = max(0, ideal - value)
    result["excess"] = max(0, value - ideal)
    result["status"] = evaluate_status(
        value, ideal, result["deficit"], result["excess"], cfg["type"]
    )
    return result

# =========================================================
# Main computation
# =========================================================

def compute_naf_pft(data) -> Dict:
    gender = data.sex.lower()
    age_group = determine_age_group(data.age)

    table = SCORING.get(gender, {}).get(age_group)
    if not table:
        return {"error": "No scoring table found"}

    cardio_type = determine_cardio_type(data.age)

    # ================= COMPONENT CALCULATIONS =================
    bmi_value = compute_bmi(data.weight, data.height)
    bmi = get_component_status(bmi_value, table["bmi"])
    cardio = get_component_status(data.cardio_cage, table["cardio"])
    step = get_component_status(data.step_up, table["step_up_3min"])
    push = get_component_status(data.push_up, table["push_up_1min"])
    sit = get_component_status(data.sit_up, table["sit_up_1min"])
    chin = get_component_status(data.chin_up, table["chin_up_1min"])
    reach = get_component_status(data.sit_reach, table["sit_reach_cm"])

    aggregate = sum(
        x["points"] for x in [bmi, cardio, step, push, sit, chin, reach]
    )

    # ================= GRADE & PRESCRIPTION =================
    if aggregate >= 90:
        grade = "Excellent"
        duration, days = "Maintain routine", "Maintain routine"
        activity = "Maintain your fitness routine engage in exercise Golf, Volley Ball, Weight Training."
    elif aggregate >= 75:
        grade = "Good"
        duration, days = "1–35 minutes", "3–4 days per week"
        activity = "Aerobic activities of moderate intensity: Tennis single, low aerobic dance and  fast walking."
    elif aggregate >= 70:
        grade = "Marginal"
        duration, days = "36–45 minutes", "3–4 days per week"
        activity = "Strenuous activities that involves stopping and starting: Basketball, soccer, circuit training and hill climbing."
    else:
        grade = "Poor"
        duration, days = "46 minutes and above", "5–6 days per week"
        activity = "Strenuous aerobic activity resulting in heavy breathing: Jogging, running, swimming, rope Skipping and  brisk walking"

    # ================= BODY WEIGHT =================
    ideal_weight = compute_ideal_weight(data.height, gender)
    weight_diff = round(data.weight - ideal_weight, 1)

    # ================= FINAL RESPONSE =================
    return {
        # ---------- BIO ----------
        "year": data.year,
        "full_name": data.full_name,
        "rank": data.rank,
        "svc_no": data.svc_no,
        "unit": data.unit,
        "appointment": data.appointment,
        "age": data.age,
        "date": data.date,
        "sex": data.sex.upper(),
        "height": data.height,
        "weight_current": data.weight,
        "email": data.email,

        # ---------- BODY WEIGHT ----------
        "weight_ideal": ideal_weight,
        "weight_excess": max(0, weight_diff),
        "weight_deficit": max(0, -weight_diff),
        "weight_status": (
            "Normal" if abs(weight_diff) <= 2
            else "Overweight" if weight_diff > 0
            else "Underweight"
        ),

        # ---------- BMI ----------
        "bmi_current": bmi["value"],
        "bmi_ideal": bmi["ideal"],
        "bmi_excess": bmi["excess"],
        "bmi_deficit": bmi["deficit"],
        "bmi_status": bmi["status"],
        "bmi_points": bmi["points"],

        # ---------- CARDIO ----------
        "cardio_type": cardio_type,
        "cardio_cage": data.cardio_cage,
        "cardio_value": cardio["value"],
        "cardio_ideal": cardio["ideal"],
        "cardio_deficit": cardio["deficit"],
        "cardio_excess": cardio["excess"],
        "cardio_status": cardio["status"],
        "cardio_points": cardio["points"],

        # ---------- STEP-UP ----------
        "step_up_value": step["value"],
        "step_up_ideal": step["ideal"],
        "step_up_deficit": step["deficit"],
        "step_up_excess": step["excess"],
        "step_up_status": step["status"],
        "step_up_points": step["points"],

        # ---------- PUSH-UP ----------
        "push_up_value": push["value"],
        "push_up_ideal": push["ideal"],
        "push_up_deficit": push["deficit"],
        "push_up_excess": push["excess"],
        "push_up_status": push["status"],
        "push_up_points": push["points"],

        # ---------- SIT-UP ----------
        "sit_up_value": sit["value"],
        "sit_up_ideal": sit["ideal"],
        "sit_up_deficit": sit["deficit"],
        "sit_up_excess": sit["excess"],
        "sit_up_status": sit["status"],
        "sit_up_points": sit["points"],

        # ---------- CHIN-UP ----------
        "chin_up_value": chin["value"],
        "chin_up_ideal": chin["ideal"],
        "chin_up_deficit": chin["deficit"],
        "chin_up_excess": chin["excess"],
        "chin_up_status": chin["status"],
        "chin_up_points": chin["points"],

        # ---------- SIT & REACH ----------
        "sit_reach_value": reach["value"],
        "sit_reach_ideal": reach["ideal"],
        "sit_reach_deficit": reach["deficit"],
        "sit_reach_excess": reach["excess"],
        "sit_reach_status": reach["status"],
        "sit_reach_points": reach["points"],

        # ---------- SUMMARY ----------
        "aggregate": aggregate,
        "grade": grade,

        # ---------- PRESCRIPTION ----------
        "prescription_duration": duration,
        "prescription_days": days,
        "recommended_activity": activity,

        # ---------- EVALUATOR ----------
        "evaluator_name": data.evaluator_name,
        "evaluator_rank": data.evaluator_rank,
    }