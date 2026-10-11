import type { ScanSummary, SecurityGrade } from "../../types/scan";
import { MetricCard } from "../molecules/metric-card";
import { FilterChips } from "../molecules/filter-chips";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "../../lib/utils";

interface ScoreboardProps {
  summary: ScanSummary;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const GRADE_BADGE: Record<
  SecurityGrade,
  { label: string; border: string; text: string; bg: string; icon: any }
> = {
  A: {
    label: "Rất An Toàn",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    bg: "bg-emerald-950/20",
    icon: ShieldCheck,
  },
  B: {
    label: "Khá Tốt",
    border: "border-teal-500/40",
    text: "text-teal-400",
    bg: "bg-teal-950/20",
    icon: ShieldCheck,
  },
  C: {
    label: "Trung Bình",
    border: "border-amber-500/40",
    text: "text-amber-400",
    bg: "bg-amber-950/20",
    icon: ShieldAlert,
  },
  D: {
    label: "Kém An Toàn",
    border: "border-orange-500/40",
    text: "text-orange-400",
    bg: "bg-orange-950/20",
    icon: ShieldAlert,
  },
  F: {
    label: "Nguy Hiểm Cao",
    border: "border-rose-500/40",
    text: "text-rose-400",
    bg: "bg-rose-950/20",
    icon: ShieldX,
  },
};

export function Scoreboard({ summary, selectedFilter, onFilterChange }: ScoreboardProps) {
  const gradeMeta = GRADE_BADGE[summary.grade] || GRADE_BADGE.C;
  const GradeIcon = gradeMeta.icon;

  const filterOptions = [
    { key: "ALL", label: "Tất cả bài test", count: summary.total_tests },
    { key: "CRITICAL", label: "Critical", count: summary.critical },
    { key: "HIGH", label: "High", count: summary.high },
    { key: "MEDIUM", label: "Medium", count: summary.medium },
    { key: "LOW", label: "Low", count: summary.low },
    { key: "PASSED", label: "Passed", count: summary.passed },
  ];

  const total = summary.total_tests || 28;

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 space-y-4">
      {/* Top Banner: Grade Badge + Metric KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Grade Badge Card */}
        <div
          className={cn(
            "p-5 rounded-xl border flex flex-col justify-between backdrop-blur-md",
            gradeMeta.border,
            gradeMeta.bg
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Grade
            </span>
            <GradeIcon className={cn("w-4 h-4", gradeMeta.text)} />
          </div>

          <div className="my-2">
            <div className={cn("text-4xl sm:text-5xl font-mono font-black tracking-tight", gradeMeta.text)}>
              {summary.grade}
            </div>
            <div className="text-xs font-medium text-zinc-300 mt-1">{gradeMeta.label}</div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            Điểm: <span className="text-white font-bold tabular-nums">{summary.score}</span>/100
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <MetricCard
          label="Critical"
          value={summary.critical}
          total={total}
          variant="critical"
        />
        <MetricCard
          label="High"
          value={summary.high}
          total={total}
          variant="high"
        />
        <MetricCard
          label="Medium"
          value={summary.medium}
          total={total}
          variant="medium"
        />
        <MetricCard
          label="Passed"
          value={summary.passed}
          total={total}
          variant="passed"
        />
      </div>

      {/* Risk Distribution Strip (5px mỏng thanh thoát) */}
      <div className="p-3.5 rounded-xl border border-white/[0.07] bg-[#0c0c0e]/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
          <span>Phân bổ rủi ro an ninh:</span>
          <span>{total} bài kiểm tra</span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden flex gap-0.5">
          {summary.critical > 0 && (
            <div
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${(summary.critical / total) * 100}%` }}
              title={`Critical: ${summary.critical}`}
            />
          )}
          {summary.high > 0 && (
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${(summary.high / total) * 100}%` }}
              title={`High: ${summary.high}`}
            />
          )}
          {summary.medium > 0 && (
            <div
              className="bg-yellow-500 h-full rounded-full transition-all"
              style={{ width: `${(summary.medium / total) * 100}%` }}
              title={`Medium: ${summary.medium}`}
            />
          )}
          {summary.low > 0 && (
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${(summary.low / total) * 100}%` }}
              title={`Low: ${summary.low}`}
            />
          )}
          {summary.passed > 0 && (
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${(summary.passed / total) * 100}%` }}
              title={`Passed: ${summary.passed}`}
            />
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterChips
        options={filterOptions}
        activeKey={selectedFilter}
        onChange={onFilterChange}
        className="pt-2"
      />
    </div>
  );
}
