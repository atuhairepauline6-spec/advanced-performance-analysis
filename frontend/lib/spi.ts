export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface SubjectStat {
  subject: string;
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  count: number;
}

export interface StudentStat {
  student: string;
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  count: number;
}

export interface TopPerformer {
  student: string;
  average: number;
}

export interface SubjectExtremes {
  highest_subject: { subject: string; mean: number };
  lowest_subject: { subject: string; mean: number };
}

async function handle(res: Response) {
  if (!res.ok) {
    const detail = await res
      .json()
      .catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  return res;
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
  await handle(res);
  return res.json();
}

export async function uploadScores(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/scores/upload`, {
    method: "POST",
    body: formData,
  });
  await handle(res);
  return res.json();
}

export async function getSubjectStats(): Promise<SubjectStat[]> {
  const res = await fetch(`${API_BASE_URL}/stats/subjects`, {
    cache: "no-store",
  });
  await handle(res);
  return res.json();
}

export async function getStudentStats(): Promise<StudentStat[]> {
  const res = await fetch(`${API_BASE_URL}/stats/students`, {
    cache: "no-store",
  });
  await handle(res);
  return res.json();
}

export async function getTopPerformer(): Promise<TopPerformer> {
  const res = await fetch(`${API_BASE_URL}/top-performer`, {
    cache: "no-store",
  });
  await handle(res);
  return res.json();
}

export async function getSubjectExtremes(): Promise<SubjectExtremes> {
  const res = await fetch(`${API_BASE_URL}/subjects/extremes`, {
    cache: "no-store",
  });
  await handle(res);
  return res.json();
}

export function chartSubjectsMeanUrl(): string {
  return `${API_BASE_URL}/charts/subjects-mean`;
}