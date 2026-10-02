# Personnel Record Reorganization

The NAF PFT system now presents personnel as a single record per service number instead of showing every yearly PFT result as a separate personnel row.

## New structure

```text
Personnel
├── Identity/profile
│   ├── Full name
│   ├── Rank
│   ├── Service number
│   ├── Unit
│   ├── Appointment
│   ├── Sex
│   └── Email
│
└── PFT evaluation history
    ├── 2026 evaluation
    ├── 2027 evaluation
    ├── 2028 evaluation
    └── ...
```

## What changed

- Admin personnel list now displays one row per service number.
- Superadmin personnel/result list now displays one row per service number.
- Each personnel row shows the latest PFT year, latest score/grade, number of evaluations, and years available.
- Opening a personnel record shows the person's profile and a complete yearly evaluation history.
- Selecting a year displays the complete existing PFT report for that evaluation.
- Certificate status/actions are tied to the selected evaluation rather than treating the whole person as one certificate.
- Existing `pft_results` data is preserved; this update does not require a destructive database migration.
- Existing evaluation IDs remain valid, so edit/certificate routes continue to work for individual yearly evaluations.
- Admin access rules remain scoped to the records the administrator is permitted to see.

## API additions

Admin:

- `GET /api/personnel`
- `GET /api/personnel-record/{result_id}`

Superadmin:

- `GET /superadmin/personnel`
- `GET /superadmin/personnel-record/{result_id}`

The existing PFT result endpoints remain available for compatibility.
