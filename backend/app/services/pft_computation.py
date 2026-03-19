# backend/app/services/pft_computation.py
from typing import Dict, Optional
from sqlalchemy.orm import Session
from app.services.models import PFTResult
from app.services.core_cal import compute_naf_pft


def recompute_and_update_pft_result(
    record: PFTResult,
    db: Session,
    partial_update: Optional[Dict] = None
) -> PFTResult:
    """
    Recomputes all derived fields based on current record values
    (after partial updates have already been applied).
    
    Includes debug logging to help diagnose why BMI/ideal weight go wrong.
    """
    print("\n" + "="*60)
    print("[RECOMPUTE START] Record ID:", record.id)
    print("Current DB values BEFORE any changes:")
    print(f"  height           : {record.height} (type: {type(record.height)})")
    print(f"  weight_current   : {record.weight_current} (type: {type(record.weight_current)})")
    print(f"  age              : {record.age}")
    print(f"  sex              : {record.sex}")
    print(f"  cardio_cage      : {record.cardio_cage}")
    print("="*60)

    # Apply partial update if provided (usually not needed here)
    if partial_update:
        print("[PARTIAL UPDATE APPLIED]:", partial_update)
        for key, value in partial_update.items():
            if hasattr(record, key) and value is not None:
                print(f"  Setting {key} = {value}")
                setattr(record, key, value)

    # Build input exactly like /api/compute expects
    input_data = {
        "year": record.year,
        "full_name": record.full_name or "",
        "rank": record.rank or "",
        "svc_no": record.svc_no or "",
        "unit": record.unit or "",
        "appointment": record.appointment or "",
        "date": record.date or "",
        "age": int(record.age) if record.age is not None else 0,
        "sex": str(record.sex).lower().strip() if record.sex else "male",
        "height": float(record.height) if record.height is not None else 0.0,
        "weight": float(record.weight_current) if record.weight_current is not None else 0.0,
        "cardio_cage": int(record.cardio_cage) if record.cardio_cage is not None else 0,
        "step_up": int(record.step_up_value) if record.step_up_value is not None else 0,
        "push_up": int(record.push_up_value) if record.push_up_value is not None else 0,
        "sit_up": int(record.sit_up_value) if record.sit_up_value is not None else 0,
        "chin_up": int(record.chin_up_value) if record.chin_up_value is not None else 0,
        "sit_reach": float(record.sit_reach_value) if record.sit_reach_value is not None else 0.0,
        "evaluator_name": record.evaluator_name or "",
        "evaluator_rank": record.evaluator_rank or "",
    }

    print("\n[INPUT DATA sent to compute_naf_pft]:")
    for k, v in sorted(input_data.items()):
        print(f"  {k:18}: {v} ({type(v).__name__})")

    try:
        result = compute_naf_pft(input_data)
        print("\n[COMPUTE RESULT returned]:")
        print("  bmi_current      :", result.get("bmi_current"))
        print("  bmi_status       :", result.get("bmi_status"))
        print("  weight_ideal     :", result.get("weight_ideal"))
        print("  aggregate        :", result.get("aggregate"))
        print("  grade            :", result.get("grade"))
        print("  Full result keys :", list(result.keys()))

        if "error" in result:
            print("[COMPUTE ERROR]:", result["error"])
            raise ValueError(f"Recompute failed: {result['error']}")

    except Exception as e:
        print("[CRITICAL RECOMPUTE EXCEPTION]:", str(e))
        import traceback
        traceback.print_exc()
        raise

    # Fields we allow to be overwritten
    recomputable_fields = {
        "bmi_current", "bmi_status", "bmi_ideal", "bmi_excess", "bmi_deficit", "bmi_points",
        "weight_ideal", "weight_excess", "weight_deficit", "weight_status",
        "cardio_type", "cardio_value", "cardio_ideal", "cardio_status", "cardio_points",
        "step_up_value", "step_up_ideal", "step_up_status", "step_up_points",
        "push_up_value", "push_up_ideal", "push_up_status", "push_up_points",
        "sit_up_value", "sit_up_ideal", "sit_up_status", "sit_up_points",
        "chin_up_value", "chin_up_ideal", "chin_up_status", "chin_up_points",
        "sit_reach_value", "sit_reach_ideal", "sit_reach_status", "sit_reach_points",
        "aggregate", "grade",
        "prescription_duration", "prescription_days", "recommended_activity",
    }

    updated_count = 0
    for field in recomputable_fields:
        if field in result and hasattr(record, field):
            old_value = getattr(record, field)
            new_value = result[field]
            if old_value != new_value:
                print(f"[UPDATED] {field:18}: {old_value} → {new_value}")
                setattr(record, field, new_value)
                updated_count += 1
            else:
                print(f"[UNCHANGED] {field:18}: {new_value}")

    print(f"\n[RECOMPUTE SUMMARY] {updated_count} fields updated")

    db.add(record)
    db.commit()
    db.refresh(record)

    print("[RECOMPUTE FINISH] Record refreshed from DB")
    print(f"  Final height     : {record.height}")
    print(f"  Final BMI        : {record.bmi_current}")
    print(f"  Final ideal weight: {record.weight_ideal}")
    print("="*60 + "\n")

    return record


# # backend/app/services/pft_utils.py
# from typing import Dict
# from sqlalchemy.orm import Session
# from app.services.models import PFTResult
# from app.services.core_cal import compute_naf_pft

# def recompute_pft_from_record(record: PFTResult) -> Dict:
#     """
#     Re-run the full NAF PFT computation using the current values stored in the database record.
#     Returns the computation result dictionary (same format as compute_naf_pft).
#     Raises ValueError if computation fails.
#     """
#     # Build input dict matching what compute_naf_pft expects
#     input_data = {
#         "year": record.year,
#         "full_name": record.full_name,
#         "rank": record.rank,
#         "svc_no": record.svc_no,
#         "unit": record.unit,
#         "appointment": record.appointment,
#         "date": record.date,
#         "email": record.email,
#         "age": record.age,
#         "sex": record.sex.lower() if record.sex else None,
#         "height": record.height,
#         "weight": record.weight_current,           # note: model uses weight_current
#         "cardio_cage": record.cardio_cage,
#         "step_up": record.step_up_value,
#         "push_up": record.push_up_value,
#         "sit_up": record.sit_up_value,
#         "chin_up": record.chin_up_value,
#         "sit_reach": record.sit_reach_value,
#         # Evaluator fields are not needed for calculation
#     }

#     # Run the full computation
#     result = compute_naf_pft(input_data)

#     if "error" in result:
#         raise ValueError(f"PFT recomputation failed: {result['error']}")

#     return result


# def apply_computed_fields_to_record(record: PFTResult, computed: Dict) -> None:
#     """
#     Updates the record's computed/derived fields from the recompute result.
#     Only touches fields that exist in both the model and the computation output.
#     """
#     field_mapping = {
#         "weight_ideal": "weight_ideal",
#         "weight_excess": "weight_excess",
#         "weight_deficit": "weight_deficit",
#         "weight_status": "weight_status",
#         "bmi_current": "bmi_current",
#         "bmi_ideal": "bmi_ideal",
#         "bmi_excess": "bmi_excess",
#         "bmi_deficit": "bmi_deficit",
#         "bmi_status": "bmi_status",
#         "bmi_points": "bmi_points",
#         "cardio_type": "cardio_type",
#         "cardio_value": "cardio_value",
#         "cardio_ideal": "cardio_ideal",
#         "cardio_deficit": "cardio_deficit",
#         "cardio_excess": "cardio_excess",
#         "cardio_status": "cardio_status",
#         "cardio_points": "cardio_points",
#         "step_up_value": "step_up_value",
#         "step_up_ideal": "step_up_ideal",
#         "step_up_deficit": "step_up_deficit",
#         "step_up_excess": "step_up_excess",
#         "step_up_status": "step_up_status",
#         "step_up_points": "step_up_points",
#         "push_up_value": "push_up_value",
#         "push_up_ideal": "push_up_ideal",
#         "push_up_deficit": "push_up_deficit",
#         "push_up_excess": "push_up_excess",
#         "push_up_status": "push_up_status",
#         "push_up_points": "push_up_points",
#         "sit_up_value": "sit_up_value",
#         "sit_up_ideal": "sit_up_ideal",
#         "sit_up_deficit": "sit_up_deficit",
#         "sit_up_excess": "sit_up_excess",
#         "sit_up_status": "sit_up_status",
#         "sit_up_points": "sit_up_points",
#         "chin_up_value": "chin_up_value",
#         "chin_up_ideal": "chin_up_ideal",
#         "chin_up_deficit": "chin_up_deficit",
#         "chin_up_excess": "chin_up_excess",
#         "chin_up_status": "chin_up_status",
#         "chin_up_points": "chin_up_points",
#         "sit_reach_value": "sit_reach_value",
#         "sit_reach_ideal": "sit_reach_ideal",
#         "sit_reach_deficit": "sit_reach_deficit",
#         "sit_reach_excess": "sit_reach_excess",
#         "sit_reach_status": "sit_reach_status",
#         "sit_reach_points": "sit_reach_points",
#         "aggregate": "aggregate",
#         "grade": "grade",
#         "prescription_duration": "prescription_duration",
#         "prescription_days": "prescription_days",
#         "recommended_activity": "recommended_activity",
#     }

#     for comp_key, db_key in field_mapping.items():
#         if comp_key in computed and hasattr(record, db_key):
#             value = computed[comp_key]
#             # Some values might be None or need type conversion — handle safely
#             if value is not None:
#                 setattr(record, db_key, value)