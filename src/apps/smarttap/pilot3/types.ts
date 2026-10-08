export type JsonRecord = Record<string, unknown>;

export type HealthResponse = {
  status: string;
  version: string;
};

export type ReadyResponse = {
  status: string;
};

export type ConfigResponse = {
  target_year: number;
  default_max_results: number;
};

export type JobStatus = "queued" | "running" | "completed" | "failed" | "interrupted";

export type JobOptions = {
  year: number;
  max_results: number;
  email_k: number;
  recipient_name: string;
  subject: string;
  summarize: boolean;
  include_google_scholar: boolean;
  include_map: boolean;
  model?: string;
  scholar_pages?: number;
  scholar_num?: number;
};

export type JobArtifacts = {
  digest?: string | null;
  results?: string | null;
};

export type Job = {
  id: string;
  status: JobStatus;
  created_at_utc: string;
  completed_at_utc: string | null;
  error: string | null;
  options: JobOptions;
  artifacts: JobArtifacts | null;
};

export type Paper = {
  title?: string;
  publication_date?: string;
  venue?: string;
  document_type?: string;
  url?: string;
  landing_url?: string;
  doi?: string;
};

export type ResultsResponse = {
  global_highlights: Paper[];
  google_scholar_top5: Paper[];
};

export type EmailPayload = {
  email: string;
  subject: string;
  pilot3_digest: string;
};

export type EmailResponse = {
  success?: boolean;
  message?: string;
};
