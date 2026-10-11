import { useMemo } from "react";
import {
  Sparkles,
  Globe,
  FileCode2,
  TerminalSquare,
} from "lucide-react";
import type { Finding, ReconData } from "../../types/scan";

interface ExecutiveBriefProps {
  findings: Finding[];
  targetUrl: string;
  reconData?: ReconData;
}

export function ExecutiveBrief({ findings, targetUrl, reconData }: ExecutiveBriefProps) {
  // Generate 3 prioritized executive recommendations based on real findings
  const recommendations = useMemo(() => {
    const list: string[] = [];

    const hasBootstrap = findings.some((f) => f.name.toLowerCase().includes("bootstrap"));
    const hasJquery = findings.some((f) => f.name.toLowerCase().includes("jquery"));
    const hasSourceMap = findings.some((f) => f.name.toLowerCase().includes("source map") || f.id === "F-SOURCEMAP");
    const hasCsp = findings.some((f) => f.name.toLowerCase().includes("content-security-policy"));
    const hasClickjacking = findings.some((f) => f.name.toLowerCase().includes("clickjacking") || f.name.toLowerCase().includes("x-frame-options"));
    const hasHsts = findings.some((f) => f.name.toLowerCase().includes("strict-transport-security") || f.name.toLowerCase().includes("hsts"));
    const hasInjections = findings.some((f) => f.group === "injections");

    if (hasBootstrap) {
      list.push("Nâng cấp thư viện Bootstrap lên phiên bản 4.3.1+ hoặc 5.x để triệt tiêu lỗ hổng XSS trong tooltip (CVE-2019-8331).");
    }
    if (hasJquery) {
      list.push("Nâng cấp thư viện jQuery lên phiên bản 3.5.0+ nhằm vá lỗi XSS trong bộ xử lý HTML động (CVE-2020-11022).");
    }
    if (hasSourceMap) {
      list.push("Vô hiệu hóa sinh tệp source map (.js.map) trên môi trường Production để ngăn kẻ tấn công dịch ngược toàn bộ mã nguồn.");
    }
    if (hasCsp && list.length < 3) {
      list.push("Thiết lập tiêu đề Content-Security-Policy (CSP) để cô lập mã nguồn JavaScript độc hại và triệt tiêu nguy cơ tiêm mã.");
    }
    if (hasClickjacking && list.length < 3) {
      list.push("Kích hoạt tiêu đề X-Frame-Options: SAMEORIGIN ngăn chặn website bị nhúng lén vào iframe trên các trang lừa đảo.");
    }
    if (hasHsts && list.length < 3) {
      list.push("Cấu hình Strict-Transport-Security (HSTS) với max-age=31536000 để bắt buộc trình duyệt luôn mã hóa HTTPS.");
    }
    if (hasInjections && list.length < 3) {
      list.push("Áp dụng Parameterized Queries (Prepared Statements) cho mọi endpoint cơ sở dữ liệu để vá triệt để lỗ hổng SQL Injection.");
    }

    if (list.length === 0) {
      list.push("Mục tiêu tuân thủ rất tốt các chuẩn bảo mật cơ bản. Hãy duy trì quét định kỳ để phòng ngừa lỗ hổng mới phát sinh.");
    }

    return list.slice(0, 3);
  }, [findings]);

  const jsCount = reconData?.js_bundles?.length || 0;
  const endpointCount = reconData?.discovered_endpoints?.length || 0;
  const formCount = reconData?.forms?.length || 0;

  return (
    <div className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl font-mono text-xs space-y-4">
      {/* Header & Recon Telemetry Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-zinc-200">
          <div className="w-6 h-6 rounded-md bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Chỉ Đạo An Ninh & Trinh Sát Bề Mặt (Attack Surface)</h4>
            <p className="text-[11px] text-zinc-400">
              Tổng hợp từ phân tích mã nguồn client và phản hồi máy chủ {targetUrl}
            </p>
          </div>
        </div>

        {/* Recon Surface Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center gap-1.5 text-[11px] text-zinc-300">
            <FileCode2 className="w-3 h-3 text-emerald-400" />
            <span>{jsCount} Bundle JS</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center gap-1.5 text-[11px] text-zinc-300">
            <TerminalSquare className="w-3 h-3 text-cyan-400" />
            <span>{endpointCount} AJAX Endpoints</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center gap-1.5 text-[11px] text-zinc-300">
            <Globe className="w-3 h-3 text-amber-400" />
            <span>{formCount} Biểu Mẫu</span>
          </div>
        </div>
      </div>

      {/* 3 Prioritized Action Items */}
      <div className="space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          3 Hành Động Khắc Phục Ưu Tiên Cao Nhất
        </div>
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed text-[11.5px] bg-zinc-900/40 border border-white/[0.03] p-2.5 rounded-xl">
            <span className="w-4 h-4 rounded-full bg-zinc-900 border border-white/[0.15] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
              {i + 1}
            </span>
            <span className="flex-1">{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
