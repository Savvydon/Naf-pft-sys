from typing import Dict
from .scoring_tables import SCORING



def time_to_minutes(minutes: int, seconds: int = 0) -> float:
    return minutes + seconds / 60.0


def get_points(value: float, ranges: list) -> int:
    if not ranges:
        return 0
    ranges = sorted(ranges, key=lambda x: x[0])
    for low, high, pts in ranges:
        if low <= value <= high:
            return pts
    if value > ranges[-1][1]:
        return ranges[-1][2]
    return 0


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
    raise ValueError(f"Age group not yet supported for age {age}")


def compute_bmi(weight_kg: float, height_m: float) -> float:
    if height_m <= 0:
        return 0.0
    return weight_kg / (height_m ** 2)


def compute_ideal_weight(height_m: float, gender: str) -> float:
    height_cm = height_m * 100
    if gender == "male":
        return 50 + 0.91 * (height_cm - 152.4)
    else:
        return 45.5 + 0.91 * (height_cm - 152.4)


def get_component_status(component: str, value: float, cfg: dict, is_time: bool = False) -> dict:
    ideal = cfg["ideal"]
    points = get_points(value, cfg["ranges"])

    status = "Excellent" if points >= 8 else \
             "Good" if points >= 5 else \
             "Fair" if points >= 2 else "Needs Improvement"

    result = {
        "value": round(value, 2) if not is_time else f"{int(value)}:{int((value % 1)*60):02d}",
        "points": points,
        "status": status
    }

    if cfg["type"] == "Higher is better":
        result["ideal"] = ideal
        result["shortfall"] = max(0, ideal - value)
        if component == "sit_up_1min":
            result["excess"] = max(0, value - ideal)
        if component == "step_up_3min":
            result["optimum"] = cfg.get("optimum", ideal + 10)

    elif cfg["type"] == "Closer to ideal":
        result["ideal"] = ideal
        diff = value - ideal
        result["excess"] = max(0, diff) if diff > 0 else 0
        result["deficit"] = max(0, -diff) if diff < 0 else 0

    else:  # cardio time – lower is better
        result["ideal"] = cfg["ideal"]
        result["excess_time"] = max(0, value - ideal)

    return result


def compute_naf_pft(data) -> Dict:
    gender = data.sex.lower()
    if gender not in ["male", "female"]:
        return {"error": "Gender must be 'male' or 'female'"}

    try:
        age_group = determine_age_group(data.age)
    except ValueError as e:
        return {"error": str(e)}

    if age_group not in SCORING[gender]:
        return {"error": f"No scoring table for {gender} {age_group}"}

    table = SCORING[gender][age_group]

    # Safety check – prevent KeyError if any component is missing
    required_keys = ["bmi", "cardio", "step_up_3min", "push_up_1min", "sit_up_1min", "chin_up_1min", "sit_reach_cm"]
    for key in required_keys:
        if key not in table:
            return {"error": f"Missing scoring data for '{key}' in {gender} {age_group}"}

    bmi = compute_bmi(data.weight, data.height)
    bmi_status = get_component_status("bmi", bmi, table["bmi"])

    ideal_weight = compute_ideal_weight(data.height, gender)
    weight_diff = data.weight - ideal_weight
    weight_status = "Normal" if -3 <= weight_diff <= 3 else \
                    "Overweight" if weight_diff > 3 else "Underweight"

    cardio_min = time_to_minutes(data.cardio_minutes, data.cardio_seconds)
    cardio_cfg = table["cardio"]
    cardio_status = get_component_status("cardio", cardio_min, cardio_cfg, is_time=True)

    step_cfg   = table["step_up_3min"]
    push_cfg   = table["push_up_1min"]
    situp_cfg  = table["sit_up_1min"]
    chin_cfg   = table["chin_up_1min"]
    reach_cfg  = table["sit_reach_cm"]

    step_status   = get_component_status("step_up",   data.step_up,   step_cfg)
    push_status   = get_component_status("push_up",   data.push_up,   push_cfg)
    situp_status  = get_component_status("sit_up",    data.sit_up,    situp_cfg)
    chin_status   = get_component_status("chin_up",   data.chin_up,   chin_cfg)
    reach_status  = get_component_status("sit_reach", data.sit_reach, reach_cfg)

    aggregate = (
        cardio_status["points"] +
        step_status["points"] +
        push_status["points"] +
        situp_status["points"] +
        chin_status["points"] +
        reach_status["points"] +
        bmi_status["points"]
    )

    if aggregate >= 90:
        grade = "Excellent"
        prescription = "Maintain your physical routine", "Maintain your routine"
        recommended_activity = "Maintain your fitness"
    elif aggregate >= 75:
        grade = "Good"
        prescription = "1-35 minute(s)", "3-4 day per week"
        recommended_activity = "AAerobic activities of moderate intensity: Tennis single, low aerobic dance and  fast walking."
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
        "year": data.unit,
        "appointment": data.appointment,
        "age": data.age,
        "sex": data.sex.upper(),
        "height": data.height,
        "cardio_type": cardio_cfg["type"],
        "email": data.email,
        "weight_current": round(data.weight, 1),
        "weight_ideal": round(ideal_weight, 1),
        "weight_excess": round(max(0, weight_diff), 1),
        "weight_deficit": round(max(0, -weight_diff), 1),
        "weight_status": weight_status,

        "bmi_current": round(bmi, 1),
        "bmi_ideal": table["bmi"]["ideal"],
        "bmi_excess": bmi_status.get("excess", 0),
        "bmi_deficit": bmi_status.get("deficit", 0),
        "bmi_status": bmi_status["status"],

        "cardio_time": cardio_status["value"],
        "cardio_ideal": cardio_status["ideal"],
        "cardio_status": cardio_status["status"],

        "step_up_value": data.step_up,
        "step_up_ideal": step_cfg["ideal"],
        "step_up_optimum": step_cfg.get("optimum", step_cfg["ideal"]),
        "step_up_status": step_status["status"],

        "push_up_value": data.push_up,
        "push_up_ideal": push_cfg["ideal"],
        "push_up_shortfall": push_status.get("shortfall", 0),
        "push_up_status": push_status["status"],

        "sit_up_value": data.sit_up,
        "sit_up_ideal": situp_cfg["ideal"],
        "sit_up_excess": situp_status.get("excess", 0),
        "sit_up_status": situp_status["status"],

        "chin_up_value": data.chin_up,
        "chin_up_ideal": chin_cfg["ideal"],
        "chin_up_deficit": chin_status.get("shortfall", 0),
        "chin_up_status": chin_status["status"],

        "sit_reach_value": data.sit_reach,
        "sit_reach_ideal": reach_cfg["ideal"],
        "sit_reach_deficit": reach_status.get("shortfall", 0),
        "sit_reach_status": reach_status["status"],

        "cardio_points": cardio_status["points"],
        "step_up_points": step_status["points"],
        "push_up_points": push_status["points"],
        "sit_up_points": situp_status["points"],
        "chin_up_points": chin_status["points"],
        "sit_reach_points": reach_status["points"],
        "bmi_points": bmi_status["points"],

        "aggregate": round(aggregate, 2),
        "grade": grade,
        "prescription_duration": prescription[0],
        "prescription_days": prescription[1],
        "recommended_activity": recommended_activity,
        "evaluator_name": data.evaluator_name,
        "evaluator_rank": data.evaluator_rank
    }