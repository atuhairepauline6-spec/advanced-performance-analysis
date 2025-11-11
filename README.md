# Advanced Performance Analysis of Classroom Scores

- Name: ATUHAIRE PAULINE
- Access Number: B35093
- Reg No: S25M19/016

## Overview
A full-stack system to upload student scores (CSV/Excel) and analyze classroom performance:
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Pandas/NumPy + Matplotlib
- Frontend: Next.js (TypeScript), Recharts, ShadCN UI
- Features: Upload datasets, compute per-subject and per-student statistics, top performer, subject extremes, and charts.

## Prerequisites
- Windows
- Python 3.11+ (3.13 works)
- Node.js 18+ (with PNPM or NPM)
- PostgreSQL (local or Neon cloud)

## Quick Start here
- Backend:
  - Activate the virtual environment: `.\.venv\Scripts\Activate.ps1` (PowerShell) or `.\.venv\Scripts\activate.bat` (Cmd)
  - Install deps: `.\.venv\Scripts\pip.exe install -r backend\requirements.txt`
  - Create `backend\.env` with `DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/pauline_db`
  - Run API: `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --app-dir d:\Projects\pauline\backend`
  - Health check: open `http://127.0.0.1:8000/health`
- Frontend:
  - Set API base URL in `frontend\.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
  - Install deps: `pnpm install` (or `npm install`)
  - Run dev server: `pnpm dev` (or `npm run dev`) and open `http://localhost:3000`

## How To Use system
- Upload page:
  - Step 1: Download CSV template from the UI (headers: `student_name,math,science,english,history`)
  - Step 2: Fill in scores and upload the CSV (or Excel `.xlsx/.xls`)
  - The backend stores/updates scores per student and subject
- Dashboard:
  - Shows aggregated analytics across all stored datasets:
    - Total students, total subjects, class average
    - Top performer (highest average)
    - Per-subject stats: mean, median, stddev, min, max, count
    - Chart: mean score by subject
    - Highest/lowest subjects by mean
- Report page:
  - Displays a “saved analysis” snapshot from the upload session (local storage)
- History page:
  - Lists previously saved analyses; open or delete entries

## API Endpoints
- `GET /health` — service status
- `POST /scores/upload` — upload CSV/Excel (wide or long format)
- `GET /stats/subjects` — per-subject stats
- `GET /stats/students` — per-student stats
- `GET /top-performer` — best student by average
- `GET /subjects/extremes` — highest and lowest subjects by mean
- `GET /charts/subjects-mean` — PNG chart of mean per subject

## CSV Formats
- Wide format:
  - First column: `student_name`
  - Following columns: subject names
- Example:
```plaintext
student_name,math,science,english,history
John Doe,85,88,82,90
Jane Smith,92,94,91,89
```

- Long format:
  - Columns: `student_name,subject,score`
- Example:
```plaintext
student_name,subject,score
John Doe,math,85
John Doe,science,88
Jane Smith,math,92
Jane Smith,science,94
```

## Folder Structure (important paths)
- `backend/app/main.py` — FastAPI routes
- `backend/app/stats.py` — analytics
- `backend/app/database.py` — DB connection (`DATABASE_URL`)
- `frontend/app` — Next.js pages (dashboard, upload, report)
- `frontend/lib/spi.ts` — typed API client to backend

## Troubleshooting
- Import error (`psycopg2` not found): ensure commands run from the virtualenv (`.\.venv\Scripts\python.exe -m uvicorn ...`).
- DB authentication error: verify `backend\.env` `DATABASE_URL` and restart backend.
- Upload error “Wide format must include 'student_name'”: ensure first CSV header is exactly `student_name` (no trailing commas).
- Unexpected extra subjects: check for `Unnamed: x` columns in CSV; subjects are case-sensitive. Redownload the template and use consistent lower-case subjects.
- Neon on Windows: if you see `channel_binding=require` errors, adjust Neon password settings (disable channel binding) or switch to `psycopg` v3 driver.

## Grading Steps
- Start backend and confirm `http://127.0.0.1:8000/health` returns `{"status":"ok"}`.
- Start frontend at `http://localhost:3000`.
- Download the template, fill 2–3 rows, and upload the CSV.
- Verify dashboard metrics and subject chart.
- Open the report page and history to review saved analyses.

---
© ATUHAIRE PAULINE — Advanced Performance Analysis of Classroom Scores