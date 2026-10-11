export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PASSED";

export type SecurityGrade = "A" | "B" | "C" | "D" | "F";

export interface Finding {
  id: string;
  group: string;
  name: string;
  severity: Severity;
  description: string;
  evidence: string;
  remediation: string;
  code_snippet?: string;
  suggested_fix?: string;
  cwe_id?: string;
  affected_url: string;
  timestamp?: string;
  attack_vector?: string;
  sample_payload?: string;
  impact?: string;
  good_code?: string;
  bad_code?: string;
}

export interface JsBundleMeta {
  url: string;
  filename: string;
  size: number;
  status: number;
  has_sourcemap: boolean;
  libraries: string[];
  endpoints_count: number;
}

export interface ReconData {
  js_bundles?: JsBundleMeta[];
  discovered_endpoints?: string[];
  forms?: Array<{ action: string; method: string; inputs: string[] }>;
  total_js_scanned?: number;
}

export interface ScanSummary {
  score: number;
  grade: SecurityGrade;
  critical: number;
  high: number;
  medium: number;
  low: number;
  passed: number;
  total_tests: number;
  duration_seconds?: number;
  recon_data?: ReconData;
}

export type ScanStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ScanResult {
  scan_id: string;
  target_url: string;
  status: ScanStatus;
  progress: number;
  current_step: string;
  start_time: string;
  end_time?: string | null;
  summary: ScanSummary;
  findings: Finding[];
  recon_data?: ReconData;
}

export interface ScanEvent {
  type: "progress" | "finding" | "complete" | "error";
  scan_id?: string;
  progress?: number;
  current_step?: string;
  finding?: Finding;
  summary?: ScanSummary;
  findings?: Finding[];
  recon_data?: ReconData;
  error?: string;
}

export interface SavedScan {
  scan_id: string;
  target_url: string;
  grade: SecurityGrade;
  score: number;
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  findings_count?: number;
}
