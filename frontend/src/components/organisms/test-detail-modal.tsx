import { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  FileCode,
  Copy,
  Check,
  Flame,
  Bug,
} from "lucide-react";
import type { Finding } from "../../types/scan";

interface TestDetailModalProps {
  check: Finding | null;
  isOpen: boolean;
  onClose: () => void;
  targetUrl?: string;
  actualStatus?: "PASSED" | "FAILED" | "UNTESTED";
}

export function TestDetailModal({
  check,
  isOpen,
  onClose,
  targetUrl,
  actualStatus = "UNTESTED",
}: TestDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !check) return null;

  const handleCopyGoodCode = () => {
    if (check.good_code || check.suggested_fix || check.code_snippet) {
      navigator.clipboard.writeText(
        check.good_code || check.suggested_fix || check.code_snippet || ""
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isFailed = actualStatus === "FAILED" || (check.severity !== "PASSED" && actualStatus !== "PASSED");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-2xl bg-[#09090b] border border-white/[0.12] rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08] transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/[0.08]">
              {check.id}
            </span>
            {check.cwe_id && (
              <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/40">
                {check.cwe_id}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-white/[0.04] capitalize">
              Nhóm: {check.group.replace("_", " ")}
            </span>
            {targetUrl && (
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-500 border border-white/[0.04] truncate max-w-[180px]">
                {targetUrl}
              </span>
            )}

            {/* Target Status Badge */}
            {actualStatus !== "UNTESTED" && (
              <span
                className={`px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1 text-[11px] ${
                  isFailed
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isFailed ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                <span>{isFailed ? "PHÁT HIỆN LỖ HỔNG" : "ĐẠT CHUẨN AN TOÀN"}</span>
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {check.name}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {check.description}
          </p>
        </div>

        {/* Attack Vector Mechanics */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Cơ Chế Khai Thác Thực Chiến Của Hacker (Attack Vector)</span>
          </div>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed">
            {check.attack_vector ||
              "Hacker tìm kiếm các điểm đầu vào hoặc phản hồi máy chủ thiếu sự kiểm tra chặt chẽ để kích hoạt hành vi độc hại vượt qua cơ chế bảo vệ SOP."}
          </p>
        </div>

        {/* Inspection Signatures & Payload */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>Phương Thức Kiểm Thử & Chữ Ký Của OguriScan</span>
          </div>
          <div className="p-3 rounded-xl bg-black border border-white/[0.08] text-[11px] text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap select-all">
            {check.sample_payload || check.evidence || "Kiểm tra sự hiện diện của trường tiêu đề hoặc thuộc tính cấu hình trong HTTP response."}
          </div>
        </div>

        {/* Exploitation Impact */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
            <Bug className="w-3.5 h-3.5" />
            <span>Hậu Quả & Kịch Bản Rủi Ro Khi Bị Khai Thác</span>
          </div>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed">
            {check.impact ||
              "Có thể dẫn đến việc rò rỉ dữ liệu phiên, mạo danh danh tính người dùng hoặc mất quyền kiểm soát cấu hình ứng dụng."}
          </p>
        </div>

        {/* Remediation Code Section (Bad vs Good) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <FileCode className="w-3.5 h-3.5" />
              <span>Hướng Dẫn Khắc Phục Chuẩn (Code Remediation)</span>
            </div>
            {(check.good_code || check.suggested_fix) && (
              <button
                onClick={handleCopyGoodCode}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-[10px] flex items-center gap-1 border border-white/[0.06]"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép Code</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-400">{check.remediation}</p>

          {/* Bad vs Good Code comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            {check.bad_code && (
              <div className="space-y-1">
                <div className="text-[10px] text-rose-400 uppercase font-semibold">
                  Mã Lỗi / Chưa An Toàn (Bad)
                </div>
                <pre className="p-3 rounded-xl bg-black/80 border border-rose-500/20 text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
                  <code>{check.bad_code}</code>
                </pre>
              </div>
            )}

            {(check.good_code || check.suggested_fix || check.code_snippet) && (
              <div className="space-y-1">
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">
                  Mã Chuẩn An Toàn (Good)
                </div>
                <pre className="p-3 rounded-xl bg-black/80 border border-emerald-500/20 text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
                  <code>{check.good_code || check.suggested_fix || check.code_snippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
          <span>Quy chuẩn tuân thủ OWASP Top 10 & CWE</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] transition-colors cursor-pointer text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
