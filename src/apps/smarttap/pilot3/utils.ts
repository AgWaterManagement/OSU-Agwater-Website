import type { Job, JobStatus, Paper } from "./types";

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}

const STATUS_COLORS: Record<JobStatus, string> = {
  queued: "gold",
  running: "gold",
  completed: "green",
  failed: "red",
  interrupted: "red",
};

export function statusColor(status: JobStatus | string): string {
  return STATUS_COLORS[status as JobStatus] ?? "default";
}

export function isJobRunning(status: JobStatus | string): boolean {
  return status === "queued" || status === "running";
}

export function hasArtifacts(job: Job | null): boolean {
  return Boolean(job?.artifacts && (job.artifacts.digest || job.artifacts.results));
}

export function paperKey(paper: Paper, index: number): string {
  return `${paper.title ?? "paper"}-${index}`;
}

export function paperMeta(paper: Paper): string {
  return [paper.publication_date, paper.venue, paper.document_type].filter(Boolean).join(" · ");
}

export function paperLink(paper: Paper): string | undefined {
  return paper.url || paper.landing_url || paper.doi;
}
