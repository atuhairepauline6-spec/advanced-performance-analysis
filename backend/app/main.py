from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from .database import Base, engine, get_db
from .models import Student, Subject, Score
from .stats import dataframe_from_db, per_subject_stats, per_student_stats, top_performer, subjects_extremes, subjects_mean_chart

app = FastAPI(title="Classroom Performance Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/scores/upload")
def upload_scores(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename or ""
    content = file.file.read()
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    columns = {c.lower(): c for c in df.columns}
    long_format = {"student_name" in columns, "subject" in columns, "score" in columns}
    if all(long_format):
        sn_col = columns["student_name"]
        subj_col = columns["subject"]
        score_col = columns["score"]
        df = df[[sn_col, subj_col, score_col]].dropna()
        for _, row in df.iterrows():
            student = db.query(Student).filter_by(name=str(row[sn_col]).strip()).first()
            if not student:
                student = Student(name=str(row[sn_col]).strip())
                db.add(student)
                db.flush()
            subject = db.query(Subject).filter_by(name=str(row[subj_col]).strip()).first()
            if not subject:
                subject = Subject(name=str(row[subj_col]).strip())
                db.add(subject)
                db.flush()
            score_val = float(row[score_col])
            existing = db.query(Score).filter_by(student_id=student.id, subject_id=subject.id).first()
            if existing:
                existing.score = score_val
            else:
                db.add(Score(student_id=student.id, subject_id=subject.id, score=score_val))
        db.commit()
        return {"status": "ok", "rows_imported": int(len(df))}
    else:
        if "student_name" not in columns:
            raise HTTPException(status_code=400, detail="Wide format must include 'student_name' column.")
        sn_col = columns["student_name"]
        subject_columns = [c for c in df.columns if c != sn_col]
        if not subject_columns:
            raise HTTPException(status_code=400, detail="No subject columns found.")
        df = df.dropna(subset=[sn_col])
        for _, row in df.iterrows():
            student_name = str(row[sn_col]).strip()
            student = db.query(Student).filter_by(name=student_name).first()
            if not student:
                student = Student(name=student_name)
                db.add(student)
                db.flush()
            for subj in subject_columns:
                val = row[subj]
                if pd.isna(val):
                    continue
                subject = db.query(Subject).filter_by(name=str(subj).strip()).first()
                if not subject:
                    subject = Subject(name=str(subj).strip())
                    db.add(subject)
                    db.flush()
                score_val = float(val)
                existing = db.query(Score).filter_by(student_id=student.id, subject_id=subject.id).first()
                if existing:
                    existing.score = score_val
                else:
                    db.add(Score(student_id=student.id, subject_id=subject.id, score=score_val))
        db.commit()
        return {"status": "ok", "rows_imported": int(len(df)), "subjects_detected": len(subject_columns)}

@app.get("/stats/subjects")
def get_subject_stats(db: Session = Depends(get_db)):
    df = dataframe_from_db(db)
    return per_subject_stats(df)

@app.get("/stats/students")
def get_student_stats(db: Session = Depends(get_db)):
    df = dataframe_from_db(db)
    return per_student_stats(df)

@app.get("/top-performer")
def get_top_performer(db: Session = Depends(get_db)):
    df = dataframe_from_db(db)
    tp = top_performer(df)
    if not tp:
        return JSONResponse(status_code=404, content={"detail": "No data"})
    return tp

@app.get("/subjects/extremes")
def get_subject_extremes(db: Session = Depends(get_db)):
    df = dataframe_from_db(db)
    ext = subjects_extremes(df)
    if not ext:
        return JSONResponse(status_code=404, content={"detail": "No data"})
    return ext

@app.get("/charts/subjects-mean")
def chart_subjects_mean(db: Session = Depends(get_db)):
    df = dataframe_from_db(db)
    if df.empty:
        return JSONResponse(status_code=404, content={"detail": "No data"})
    png_bytes = subjects_mean_chart(df)
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")