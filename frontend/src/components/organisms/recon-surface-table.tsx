import { useState, useMemo } from "react";
import {
  FileCode2,
  Terminal,
  Globe,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Layers,
} from "lucide-react";
import type { ReconData } from "../../types/scan";

interface ReconSurfaceTableProps {
  reconData?: ReconData;
  targetUrl: string;
}

export function ReconSurfaceTable({ reconData, targetUrl }: ReconSurfaceTableProps) {
  const [activeSubTab, setActiveSubTab] = useState<"endpoints" | "bundles" | "forms">("endpoints");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const jsBundles = reconData?.js_bundles || [];
  const endpoints = reconData?.discovered_endpoints || [];
  const forms = reconData?.forms || [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return endpoints;
    const q = searchQuery.toLowerCase();
    return endpoints.filter((ep) => ep.toLowerCase().includes(q));
  }, [endpoints, searchQuery]);

  const filteredBundles = useMemo(() => {
    if (!searchQuery.trim()) return jsBundles;
    const q = searchQuery.toLowerCase();
    return jsBundles.filter(
      (b) =>
        b.filename.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.libraries.some((lib) => lib.toLowerCase().includes(q))
    );
  }, [jsBundles, searchQuery]);

  return (
    <div className="w-full bg-[#09090b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl font-mono text-xs space-y-4">
      {/* Header and Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">
              Trinh Sát Mã Nguồn & Bề Mặt Tấn Công (JS & API Recon)
            </h4>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Các tài nguyên frontend, tệp bundle và tuyến đường AJAX phát hiện trên {targetUrl}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setActiveSubTab("endpoints")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "endpoints"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>AJAX Endpoints ({endpoints.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("bundles")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "bundles"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tệp JavaScript ({jsBundles.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("forms")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "forms"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Biểu Mẫu ({forms.length})</span>
          </button>
        </div>
      </div>

      {/* Search Filter Omnibar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeSubTab === "endpoints"
              ? "Tìm kiếm endpoint AJAX (ví dụ: .aspx, /api, load, edit)..."
              : activeSubTab === "bundles"
              ? "Tìm kiếm tệp JS hoặc thư viện (jquery, bootstrap)..."
              : "Tìm kiếm biểu mẫu hoặc tham số..."
          }
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] text-xs"
        />
      </div>

      {/* SUBTAB 1: ENDPOINTS LIST */}
      {activeSubTab === "endpoints" && (
        <div className="space-y-2">
          {filteredEndpoints.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-white/[0.04]">
              Không tìm thấy endpoint nào phù hợp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {filteredEndpoints.map((ep, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-white/[0.04] hover:border-white/[0.1] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-zinc-500 w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-mono text-zinc-300 group-hover:text-cyan-300 transition-colors truncate text-[11.5px]">
                      {ep}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(ep)}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px]"
                      title="Sao chép đường dẫn"
                    >
                      {copiedText === ep ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: JS BUNDLES LIST */}
      {activeSubTab === "bundles" && (
        <div className="space-y-2">
          {filteredBundles.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-white/[0.04]">
              Không có tệp JavaScript nào được ghi nhận.
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {filteredBundles.map((bundle, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04] hover:border-white/[0.1] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-white text-xs truncate">
                        {bundle.filename}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        ({Math.round(bundle.size / 1024)} KB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {bundle.has_sourcemap ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-400 border border-rose-800/40 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Lộ Source Map</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-white/[0.04]">
                          Không có .map
                        </span>
                      )}

                      <a
                        href={bundle.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Mở tệp script trong tab mới"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-zinc-400 font-mono truncate">
                    {bundle.url}
                  </p>

                  {/* Detected Libraries */}
                  {bundle.libraries.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/[0.03]">
                      <span className="text-[10px] text-zinc-500">Thư viện nhận diện:</span>
                      {bundle.libraries.map((lib, lIdx) => (
                        <span
                          key={lIdx}
                          className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-amber-300 border border-amber-500/20"
                        >
                          {lib}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: FORMS & INPUTS */}
      {activeSubTab === "forms" && (
        <div className="space-y-2">
          {forms.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-white/[0.04]">
              Không phát hiện thẻ &lt;form&gt; HTML nào trên trang chủ.
            </div>
          ) : (
            <div className="space-y-2">
              {forms.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      Biểu Mẫu {f.method}: {f.action}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300">
                      {f.inputs.length} tham số
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-zinc-500">Các trường dữ liệu:</span>
                    {f.inputs.map((inp, iIdx) => (
                      <span
                        key={iIdx}
                        className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono border border-white/[0.04]"
                      >
                        {inp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
