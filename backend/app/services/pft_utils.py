# backend/app/services/pft_utils.py
from typing import Dict
from sqlalchemy.orm import Session
from app.services.models import PFTResult
from app.services.core_cal import compute_naf_pft

def recompute_pft_from_record(record: PFTResult) -> Dict:
    """
    Re-run the full NAF PFT computation using the current values stored in the database record.
    Returns the computation result dictionary (same format as compute_naf_pft).
    Raises ValueError if computation fails.
    """
    # Build input dict matching what compute_naf_pft expects
    input_data = {
        "year": record.year,
        "full_name": record.full_name,
        "rank": record.rank,
        "svc_no": record.svc_no,
        "unit": record.unit,
        "appointment": record.appointment,
        "date": record.date,
        "email": record.email,
        "age": record.age,
        "sex": record.sex.lower() if record.sex else None,
        "height": record.height,
        "weight": record.weight_current,           # note: model uses weight_current
        "cardio_cage": record.cardio_cage,
        "step_up": record.step_up_value,
        "push_up": record.push_up_value,
        "sit_up": record.sit_up_value,
        "chin_up": record.chin_up_value,
        "sit_reach": record.sit_reach_value,
        # Evaluator fields are not needed for calculation
    }

    # Run the full computation
    result = compute_naf_pft(input_data)

    if "error" in result:
        raise ValueError(f"PFT recomputation failed: {result['error']}")

    return result


def apply_computed_fields_to_record(record: PFTResult, computed: Dict) -> None:
    """
    Updates the record's computed/derived fields from the recompute result.
    Only touches fields that exist in both the model and the computation output.
    """
    field_mapping = {
        "weight_ideal": "weight_ideal",
        "weight_excess": "weight_excess",
        "weight_deficit": "weight_deficit",
        "weight_status": "weight_status",
        "bmi_current": "bmi_current",
        "bmi_ideal": "bmi_ideal",
        "bmi_excess": "bmi_excess",
        "bmi_deficit": "bmi_deficit",
        "bmi_status": "bmi_status",
        "bmi_points": "bmi_points",
        "cardio_type": "cardio_type",
        "cardio_value": "cardio_value",
        "cardio_ideal": "cardio_ideal",
        "cardio_deficit": "cardio_deficit",
        "cardio_excess": "cardio_excess",
        "cardio_status": "cardio_status",
        "cardio_points": "cardio_points",
        "step_up_value": "step_up_value",
        "step_up_ideal": "step_up_ideal",
        "step_up_deficit": "step_up_deficit",
        "step_up_excess": "step_up_excess",
        "step_up_status": "step_up_status",
        "step_up_points": "step_up_points",
        "push_up_value": "push_up_value",
        "push_up_ideal": "push_up_ideal",
        "push_up_deficit": "push_up_deficit",
        "push_up_excess": "push_up_excess",
        "push_up_status": "push_up_status",
        "push_up_points": "push_up_points",
        "sit_up_value": "sit_up_value",
        "sit_up_ideal": "sit_up_ideal",
        "sit_up_deficit": "sit_up_deficit",
        "sit_up_excess": "sit_up_excess",
        "sit_up_status": "sit_up_status",
        "sit_up_points": "sit_up_points",
        "chin_up_value": "chin_up_value",
        "chin_up_ideal": "chin_up_ideal",
        "chin_up_deficit": "chin_up_deficit",
        "chin_up_excess": "chin_up_excess",
        "chin_up_status": "chin_up_status",
        "chin_up_points": "chin_up_points",
        "sit_reach_value": "sit_reach_value",
        "sit_reach_ideal": "sit_reach_ideal",
        "sit_reach_deficit": "sit_reach_deficit",
        "sit_reach_excess": "sit_reach_excess",
        "sit_reach_status": "sit_reach_status",
        "sit_reach_points": "sit_reach_points",
        "aggregate": "aggregate",
        "grade": "grade",
        "prescription_duration": "prescription_duration",
        "prescription_days": "prescription_days",
        "recommended_activity": "recommended_activity",
    }

    for comp_key, db_key in field_mapping.items():
        if comp_key in computed and hasattr(record, db_key):
            value = computed[comp_key]
            # Some values might be None or need type conversion — handle safely
            if value is not None:
                setattr(record, db_key, value)