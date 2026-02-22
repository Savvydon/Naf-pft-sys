
from typing import Dict
from .scoring_tables import SCORING


# =========================================================
# Utility functions
# =========================================================

def get_points(value: float, ranges: list) -> int:
    if not ranges:
        return 0
    ranges = sorted(ranges, key=lambda x: x[0])
    for low, high, pts in ranges:
        if low <= value <= high:
            return pts
    return ranges[-1][2] if value > ranges[-1][1] else 0


def determine_age_group(age: int) -> str:
    if age <= 29:
        return "<29"
    elif 30 <= age <= 39:
        return "30-39"
    elif 40 <= age <= 49:
        return "40-49"
    elif 50 <= age <= 59:
        return "50-59"
    elif age >= 60:
        return "60+"
    raise ValueError(f"Unsupported age: {age}")


def compute_bmi(weight_kg: float, height_m: float) -> float:
    if height_m <= 0:
        return 0.0
    return round(weight_kg / (height_m ** 2), 2)


def compute_ideal_weight(height_m: float, gender: str) -> float:
    height_cm = height_m * 100
    if gender == "male":
        return round(50 + 0.91 * (height_cm - 152.4), 1)
    return round(45.5 + 0.91 * (height_cm - 152.4), 1)


# =========================================================
# Component scoring engine (FIXED & SAFE)
# =========================================================

def get_component_status(component: str, value: float, cfg: dict) -> dict:
    points = get_points(value, cfg["ranges"])

    result = {
        "value": round(value, 2),
        "points": points,
        "status": (
            "Excellent" if points >= 20 else
            "Good" if points >= 10 else
            "Fair" if points >= 5 else
            "Needs Improvement"
        )
    }

    # ---- BMI (range-based) ----
    if cfg["type"] == "Closer to ideal":
        low, high = cfg["ideal"]
        result["ideal_range"] = f"{low}–{high}"
        result["excess"] = round(max(0, value - high), 2)
        result["deficit"] = round(max(0, low - value), 2)

    # ---- Repetition-based ----
    elif cfg["type"] == "Higher is better":
        ideal = cfg["ideal"]
        result["ideal"] = ideal
        result["shortfall"] = round(max(0, ideal - value), 1)
        result["excess"] = round(max(0, value - ideal), 1)

    # ---- Cardio (Cage-based) ----
    elif cfg["type"] == "Cage-based":
        ideal = cfg["ideal"]
        result["ideal"] = ideal
        result["excess"] = round(max(0, value - ideal), 1)

    return result


# =========================================================
# Main computation
# =========================================================

def compute_naf_pft(data) -> Dict:
    gender = data.sex.lower()
    if gender not in ("male", "female"):
        return {"error": "Gender must be male or female"}

    age_group = determine_age_group(data.age)
    table = SCORING.get(gender, {}).get(age_group)

    if not table:
        return {"error": f"No scoring table for {gender} {age_group}"}

    # ---- BMI ----
    bmi_value = compute_bmi(data.weight, data.height)
    bmi_status = get_component_status("bmi", bmi_value, table["bmi"])

    # ---- Weight ----
    ideal_weight = compute_ideal_weight(data.height, gender)
    weight_diff = round(data.weight - ideal_weight, 1)
    weight_status = (
        "Normal" if -3 <= weight_diff <= 3 else
        "Overweight" if weight_diff > 3 else
        "Underweight"
    )

    # ---- Cardio ----
    cardio_cfg = table["cardio"]
    cardio_status = get_component_status("cardio", data.cardio_cage, cardio_cfg)

    # ---- Other components ----
    step_status  = get_component_status("step_up", data.step_up, table["step_up_3min"])
    push_status  = get_component_status("push_up", data.push_up, table["push_up_1min"])
    sit_status   = get_component_status("sit_up", data.sit_up, table["sit_up_1min"])
    chin_status  = get_component_status("chin_up", data.chin_up, table["chin_up_1min"])
    reach_status = get_component_status("sit_reach", data.sit_reach, table["sit_reach_cm"])

    aggregate = sum([
        bmi_status["points"],
        cardio_status["points"],
        step_status["points"],
        push_status["points"],
        sit_status["points"],
        chin_status["points"],
        reach_status["points"],
    ])

    # ---- Grade ----
    if aggregate >= 90:
        grade = "Excellent"
        prescription = "Maintain your physical routine", "Maintain your routine"
        recommended_activity = "Maintain your fitness"
    elif aggregate >= 75:
        grade = "Good"
        prescription = "1-35 minute(s)", "3-4 day per week"
        recommended_activity = "Aerobic activities of moderate intensity: Tennis single, low aerobic dance and  fast walking."
    elif aggregate >= 70:
        grade = "Marginal"
        prescription = "36-45 minutes", "3-4 day per week"
        recommended_activity = "Strenuous activities that involves stopping and starting: Basketball, soccer, circuit training and hill climbing."
    else:
        grade = "Poor"
        prescription = "46 minutes and above", "5-6 day per week"
        recommended_activity = "Strenuous aerobic activity resulting in heavy breathing: Jogging, running, swimming, rope Skipping and  brisk walking."

    return {
        "full_name": data.full_name,
        "rank": data.rank,
        "svc_no": data.svc_no,
        "unit": data.unit,
        "year": data.year,
        "appointment": data.appointment,
        "age": data.age,
        "date": data.date,
        "sex": data.sex.upper(),
        "height": data.height,
        "email": data.email,

        "weight_current": round(data.weight, 1),
        "weight_ideal": ideal_weight,
        "weight_excess": max(0, weight_diff),
        "weight_deficit": max(0, -weight_diff),
        "weight_status": weight_status,

        "bmi_current": bmi_value,
        "bmi_ideal_range": bmi_status["ideal_range"],
        "bmi_excess": bmi_status["excess"],
        "bmi_deficit": bmi_status["deficit"],
        "bmi_status": bmi_status["status"],
        "bmi_points": bmi_status["points"],

        "cardio_value": data.cardio_cage,
        "cardio_ideal": cardio_status["ideal"],
        "cardio_status": cardio_status["status"],
        "cardio_points": cardio_status["points"],

        "aggregate": aggregate,
        "grade": grade,
        "prescription_duration": duration,
        "prescription_days": days,
        "recommended_activity": activity,

        "evaluator_name": data.evaluator_name,
        "evaluator_rank": data.evaluator_rank,
    }