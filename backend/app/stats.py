import io
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sqlalchemy.orm import Session
from .models import Score, Student, Subject

def dataframe_from_db(db: Session) -> pd.DataFrame:
    rows = (
        db.query(Student.name, Subject.name, Score.score)
        .join(Score, Student.id == Score.student_id)
        .join(Subject, Subject.id == Score.subject_id)
        .all()
    )
    df = pd.DataFrame(rows, columns=["student_name", "subject_name", "score"])
    return df

def per_subject_stats(df: pd.DataFrame):
    if df.empty:
        return []
    grouped = df.groupby("subject_name")["score"]
    results = []
    for subj, series in grouped:
        results.append({
            "subject": subj,
            "mean": float(series.mean()),
            "median": float(series.median()),
            "stddev": float(series.std(ddof=1)) if len(series) > 1 else 0.0,
            "min": float(series.min()),
            "max": float(series.max()),
            "count": int(series.count()),
        })
    return sorted(results, key=lambda r: r["subject"])

def per_student_stats(df: pd.DataFrame):
    if df.empty:
        return []
    grouped = df.groupby("student_name")["score"]
    results = []
    for student, series in grouped:
        results.append({
            "student": student,
            "mean": float(series.mean()),
            "median": float(series.median()),
            "stddev": float(series.std(ddof=1)) if len(series) > 1 else 0.0,
            "min": float(series.min()),
            "max": float(series.max()),
            "count": int(series.count()),
        })
    return sorted(results, key=lambda r: r["student"])

def top_performer(df: pd.DataFrame):
    if df.empty:
        return None
    means = df.groupby("student_name")["score"].mean()
    idx = means.idxmax()
    return {"student": idx, "average": float(means.loc[idx])}

def subjects_extremes(df: pd.DataFrame):
    if df.empty:
        return None
    means = df.groupby("subject_name")["score"].mean()
    return {
        "highest_subject": {"subject": means.idxmax(), "mean": float(means.max())},
        "lowest_subject": {"subject": means.idxmin(), "mean": float(means.min())},
    }

def subjects_mean_chart(df: pd.DataFrame) -> bytes:
    means = df.groupby("subject_name")["score"].mean().sort_values(ascending=False)
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(means.index, means.values, color="#3b82f6")
    ax.set_xlabel("Subject")
    ax.set_ylabel("Mean score")
    ax.set_title("Mean Score per Subject")
    ax.set_ylim(0, max(100, float(means.max()) + 5))
    plt.xticks(rotation=30, ha="right")
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return buf.getvalue()