import { useState, useEffect, useRef, useMemo } from "react";
import {
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Download,
  Printer,
  Share2,
  Check,
  ShieldAlert,
  Terminal,
  SlidersHorizontal,
} from "lucide-react";
import type { ScanResult, SavedScan, Finding } from "./types/scan";
import { startScan, getScan, cancelScan, streamScan } from "./lib/api";
import { getHistory, saveScanToHistory, removeHistoryItem, clearHistory } from "./lib/storage";
import { INITIAL_SECURITY_CHECKS } from "./lib/default-checks";

// Layout & Organisms
import { WorkspaceLayout } from "./components/layout/workspace-layout";
import { SmartOmnibar } from "./components/organisms/smart-omnibar";
import { CommandPalette } from "./components/molecules/command-palette";
import { FindingsDataGrid } from "./components/organisms/findings-data-grid";
import { InspectorDrawer } from "./components/organisms/inspector-drawer";
import { RulebookMatrix } from "./components/organisms/rulebook-matrix";
import { ExecutiveBrief } from "./components/molecules/executive-brief";
import { ReconSurfaceTable } from "./components/organisms/recon-surface-table";
import { TestDetailModal } from "./components/organisms/test-detail-modal";
import { ScanCompletionModal } from "./components/molecules/scan-completion-modal";

export function App() {
  const [activeView, setActiveView] = useState<"home" | "scanning" | "results">("home");
  const [homeTab, setHomeTab] = useState<"rulebook" | "history">("rulebook");
  const [resultsTab, setResultsTab] = useState<"findings" | "recon" | "rulebook">("findings");
  const [scanProfile, setScanProfile] = useState<"quick" | "full">("full");
  const [targetUrl, setTargetUrl] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<SavedScan[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Rulebook Check IDs (Default all checks enabled)
  const [enabledCheckIds, setEnabledCheckIds] = useState<Set<string>>(
    () => new Set(INITIAL_SECURITY_CHECKS.map((c) => c.id))
  );

  // Command Palette, Inspector, Modal States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [inspectingTest, setInspectingTest] = useState<Finding | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const cleanupStreamRef = useRef<(() => void) | null>(null);

  // Load history & URL query params on mount
  useEffect(() => {
    setHistory(getHistory());

    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("scan_id");
    if (idFromQuery) {
      loadScanById(idFromQuery);
    }

    return () => {
      if (cleanupStreamRef.current) {
        cleanupStreamRef.current();
      }
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K / Esc)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      // Esc handler
      if (e.key === "Escape") {
        if (inspectingTest) {
          setInspectingTest(null);
        } else if (isCompletionModalOpen) {
          setIsCompletionModalOpen(false);
        } else if (selectedFinding) {
          setSelectedFinding(null);
        } else if (isPaletteOpen) {
          setIsPaletteOpen(false);
        } else if (activeView === "scanning") {
          handleCancelScan();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedFinding, isPaletteOpen, activeView, scanId, inspectingTest, isCompletionModalOpen]);

  const loadScanById = async (id: string) => {
    try {
      setErrorMessage(null);
      const res = await getScan(id);
      setScanResult(res);
      setTargetUrl(res.target_url);
      setScanId(res.scan_id);
      setActiveView("results");
      setResultsTab("findings");
      // Default select the first critical or first finding for immediate inspector preview
      if (res.findings && res.findings.length > 0) {
        setSelectedFinding(res.findings[0]);
      }
    } catch {
      console.warn("Không tìm thấy kết quả quét cho scan_id:", id);
    }
  };

  const handleStartScan = async (url: string) => {
    setErrorMessage(null);
    setTargetUrl(url);
    setProgress(5);
    setCurrentStep("Đang khởi tạo các bài kiểm tra an ninh…");
    setActiveView("scanning");
    setIsCancelling(false);
    setSelectedFinding(null);
    setIsCompletionModalOpen(false);

    try {
      const init = await startScan(url);
      setScanId(init.scan_id);

      const cleanup = streamScan(
        init.scan_id,
        (event) => {
          if (event.type === "progress") {
            if (event.progress !== undefined) setProgress(event.progress);
            if (event.current_step) setCurrentStep(event.current_step);
          } else if (event.type === "complete") {
            setProgress(100);
            setCurrentStep("Hoàn thành rà soát toàn diện!");

            getScan(init.scan_id).then((fullResult) => {
              setScanResult(fullResult);
              setActiveView("results");
              setResultsTab("findings");
              setIsCompletionModalOpen(true); // Triggers the animated celebration HUD!
              if (fullResult.findings && fullResult.findings.length > 0) {
                setSelectedFinding(fullResult.findings[0]);
              }

              const savedItem: SavedScan = {
                scan_id: fullResult.scan_id,
                target_url: fullResult.target_url,
                grade: fullResult.summary.grade,
                score: fullResult.summary.score,
                timestamp: new Date().toISOString(),
                critical: fullResult.summary.critical,
                high: fullResult.summary.high,
                medium: fullResult.summary.medium,
                findings_count: fullResult.findings.length,
              };
              saveScanToHistory(savedItem);
              setHistory(getHistory());
            });
          } else if (event.type === "error") {
            setErrorMessage(event.error || "Đã xảy ra lỗi trong quá trình quét");
            setActiveView("home");
          }
        },
        () => {
          cleanupStreamRef.current = null;
        },
        (err) => {
          console.warn("SSE stream closed:", err);
        }
      );

      cleanupStreamRef.current = cleanup;
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể kết nối tới máy chủ quét bảo mật.");
      setActiveView("home");
    }
  };

  const handleCancelScan = async () => {
    if (!scanId) return;
    setIsCancelling(true);
    if (cleanupStreamRef.current) {
      cleanupStreamRef.current();
      cleanupStreamRef.current = null;
    }
    await cancelScan(scanId);
    setIsCancelling(false);
    setActiveView("home");
  };

  const handleSelectHistory = async (id: string) => {
    try {
      await loadScanById(id);
    } catch {
      const found = history.find((h) => h.scan_id === id);
      if (found) handleStartScan(found.target_url);
    }
  };

  const handleRemoveHistory = (id: string) => {
    const updated = removeHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleReset = () => {
    setActiveView("home");
    setScanResult(null);
    setScanId(null);
    setSelectedFinding(null);
    setIsCompletionModalOpen(false);
    window.history.pushState({}, "", window.location.pathname);
  };

  // Rulebook Scope Toggles
  const handleToggleCheck = (id: string) => {
    const updated = new Set(enabledCheckIds);
    if (updated.has(id)) {
      if (updated.size > 1) updated.delete(id);
    } else {
      updated.add(id);
    }
    setEnabledCheckIds(updated);
  };

  const handleEnableAllChecks = () => {
    setEnabledCheckIds(new Set(INITIAL_SECURITY_CHECKS.map((c) => c.id)));
  };

  const handleDisableAllChecks = () => {
    if (INITIAL_SECURITY_CHECKS.length > 0) {
      setEnabledCheckIds(new Set([INITIAL_SECURITY_CHECKS[0].id]));
    }
  };

  const handleResetChecks = () => {
    setEnabledCheckIds(new Set(INITIAL_SECURITY_CHECKS.map((c) => c.id)));
  };

  // Export JSON
  const handleExportJson = () => {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify(scanResult, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oguriscan-${scanResult.scan_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Share URL
  const handleShare = () => {
    if (!scanResult) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?scan_id=${scanResult.scan_id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Dynamic Live Streaming Findings during scanning
  const liveStreamingFindings = useMemo(() => {
    if (activeView !== "scanning") return [];
    return INITIAL_SECURITY_CHECKS.map((check, index) => {
      const checkThreshold = (index / INITIAL_SECURITY_CHECKS.length) * 100;
      if (progress >= checkThreshold + 10) {
        return { ...check, severity: "PASSED" as const };
      } else if (progress >= checkThreshold) {
        return { ...check, severity: "MEDIUM" as const, name: `[Đang rà soát] ${check.name}` };
      } else {
        return { ...check, severity: "LOW" as const, name: `[Chờ xử lý] ${check.name}` };
      }
    });
  }, [activeView, progress]);

  // Determine actual target status for a test if inspected
  const getInspectingTestStatus = (check: Finding | null) => {
    if (!check || !scanResult) return "UNTESTED" as const;
    const failedMatch = scanResult.findings.find(
      (f) => f.id === check.id || f.name.toLowerCase() === check.name.toLowerCase()
    );
    if (failedMatch) return "FAILED" as const;
    return "PASSED" as const;
  };

  return (
    <WorkspaceLayout
      onGoHome={handleReset}
      onOpenPalette={() => setIsPaletteOpen(true)}
      engineStatus="DAST Online"
    >
      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 flex items-start gap-3 animate-in-view max-w-4xl mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono">
            <p className="font-semibold text-rose-200">Không thể thực hiện rà soát</p>
            <p className="text-zinc-300 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: HOME SMART WORKSPACE */}
      {activeView === "home" && (
        <div className="space-y-6 animate-in-view">
          {/* Smart Omnibar with URL Parser & Profile Switcher */}
          <SmartOmnibar
            onStartScan={handleStartScan}
            isLoading={false}
            onOpenPalette={() => setIsPaletteOpen(true)}
            scanProfile={scanProfile}
            onProfileChange={setScanProfile}
            activeRulesCount={enabledCheckIds.size}
          />

          {/* Interactive Rulebook & History Tabs */}
          <RulebookMatrix
            activeTab={homeTab}
            onTabChange={setHomeTab}
            enabledCheckIds={enabledCheckIds}
            onToggleCheck={handleToggleCheck}
            onEnableAll={handleEnableAllChecks}
            onDisableAll={handleDisableAllChecks}
            onResetChecks={handleResetChecks}
            scans={history}
            onSelectScan={handleSelectHistory}
            onRemoveScan={handleRemoveHistory}
            onClearAllScans={handleClearHistory}
            onInspectCheck={(check) => setInspectingTest(check)}
          />
        </div>
      )}

      {/* VIEW 2: INLINE LIVE STREAMING SCANNING */}
      {activeView === "scanning" && (
        <div className="space-y-5 animate-in-view max-w-4xl mx-auto">
          {/* Smart Omnibar (Disabled during scan) */}
          <SmartOmnibar
            onStartScan={handleStartScan}
            isLoading={true}
            onOpenPalette={() => setIsPaletteOpen(true)}
            scanProfile={scanProfile}
            activeRulesCount={enabledCheckIds.size}
          />

          {/* Cancel button shortcut */}
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span>Tiến trình rà soát trực tiếp {INITIAL_SECURITY_CHECKS.length} bài kiểm tra</span>
            <button
              onClick={handleCancelScan}
              disabled={isCancelling}
              className="text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-[10px] text-zinc-300">
                Esc
              </kbd>
              <span>{isCancelling ? "Đang hủy..." : "Hủy rà soát"}</span>
            </button>
          </div>

          {/* Inline Live Streaming Data Grid */}
          <FindingsDataGrid
            findings={liveStreamingFindings}
            targetUrl={targetUrl}
            isScanning={true}
            scanProgress={progress}
            currentStep={currentStep}
            onSelectFinding={(f) => setSelectedFinding(f)}
            selectedFindingId={selectedFinding?.id}
          />
        </div>
      )}

      {/* VIEW 3: RESULTS EXECUTIVE REPORT WITH ADAPTIVE TABS & RECON MATRIX */}
      {activeView === "results" && scanResult && (
        <div className="space-y-5 animate-in-view max-w-6xl mx-auto">
          {/* Executive Header Toolbar */}
          <div className="p-4 bg-[#09090b] border border-white/[0.08] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            {/* Left: Target & Score Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black font-mono shrink-0 border ${
                  scanResult.summary.grade === "A"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : scanResult.summary.grade === "B"
                    ? "bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                    : scanResult.summary.grade === "C"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                }`}
              >
                {scanResult.summary.grade}
              </div>

              <div className="min-w-0 font-mono">
                <div className="text-white font-bold text-sm truncate flex items-center gap-2">
                  <span>{scanResult.target_url}</span>
                  <span className="text-zinc-500 text-xs font-normal">
                    ({scanResult.summary.score}/100)
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  ID: {scanResult.scan_id.slice(0, 10)}… • {new Date(scanResult.start_time).toLocaleString("vi-VN")}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <button
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Quay lại trang chủ"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </button>

              <button
                onClick={() => handleStartScan(scanResult.target_url)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Quét lại mục tiêu này"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Quét lại</span>
              </button>

              <button
                onClick={handleExportJson}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Xuất file JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="In hoặc lưu báo cáo PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleShare}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                title="Sao chép liên kết báo cáo"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Actionable Executive Security Brief & Recon Surface Summary (No Nginx!) */}
          <ExecutiveBrief
            findings={scanResult.findings}
            targetUrl={scanResult.target_url}
            reconData={scanResult.recon_data}
          />

          {/* Results View Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 font-mono text-xs">
            <button
              onClick={() => setResultsTab("findings")}
              className={`px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                resultsTab === "findings"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Lỗ Hổng & Cảnh Báo ({scanResult.findings.length})</span>
            </button>

            <button
              onClick={() => setResultsTab("recon")}
              className={`px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                resultsTab === "recon"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Trinh Sát JS & Endpoints (
                {scanResult.recon_data?.discovered_endpoints?.length || 0})
              </span>
            </button>

            <button
              onClick={() => setResultsTab("rulebook")}
              className={`px-3 py-2 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                resultsTab === "rulebook"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bộ Quy Chuẩn {INITIAL_SECURITY_CHECKS.length} Bài Kiểm Tra</span>
            </button>
          </div>

          {/* RESULTS TAB 1: FINDINGS DATA GRID + SPLIT INSPECTOR */}
          {resultsTab === "findings" && (
            <div className="flex flex-col lg:flex-row gap-4 items-start animate-in-view">
              {/* Left: Findings Data Grid */}
              <div className="flex-1 min-w-0 w-full">
                <FindingsDataGrid
                  findings={scanResult.findings}
                  targetUrl={scanResult.target_url}
                  onSelectFinding={(f) => setSelectedFinding(f)}
                  selectedFindingId={selectedFinding?.id}
                  isSplitView={!!selectedFinding}
                />
              </div>

              {/* Right: Side Inspector Panel */}
              {selectedFinding && (
                <div className="w-full lg:w-[480px] shrink-0 sticky top-16">
                  <InspectorDrawer
                    finding={selectedFinding}
                    targetUrl={scanResult.target_url}
                    onClose={() => setSelectedFinding(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB 2: RECONNAISSANCE SURFACE TABLE */}
          {resultsTab === "recon" && (
            <div className="animate-in-view">
              <ReconSurfaceTable
                reconData={scanResult.recon_data}
                targetUrl={scanResult.target_url}
              />
            </div>
          )}

          {/* RESULTS TAB 3: FULL RULEBOOK MATRIX WITH INTERACTIVE INSPECT */}
          {resultsTab === "rulebook" && (
            <div className="animate-in-view">
              <RulebookMatrix
                activeTab="rulebook"
                onTabChange={() => {}}
                enabledCheckIds={enabledCheckIds}
                onToggleCheck={handleToggleCheck}
                onEnableAll={handleEnableAllChecks}
                onDisableAll={handleDisableAllChecks}
                onResetChecks={handleResetChecks}
                scans={history}
                onSelectScan={handleSelectHistory}
                onRemoveScan={handleRemoveHistory}
                onClearAllScans={handleClearHistory}
                onInspectCheck={(check) => setInspectingTest(check)}
              />
            </div>
          )}
        </div>
      )}

      {/* Global Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onStartScan={handleStartScan}
        onExportJson={activeView === "results" ? handleExportJson : undefined}
        onPrintPdf={activeView === "results" ? handlePrintPdf : undefined}
        onClearHistory={handleClearHistory}
        onSelectScan={handleSelectHistory}
        history={history}
      />

      {/* Animated Scan Completion Celebration HUD Modal */}
      {scanResult && (
        <ScanCompletionModal
          isOpen={isCompletionModalOpen}
          onClose={() => setIsCompletionModalOpen(false)}
          scanResult={scanResult}
          onExportJson={handleExportJson}
          onShare={handleShare}
        />
      )}

      {/* Interactive Test Specification & Vector Detail Modal */}
      <TestDetailModal
        check={inspectingTest}
        isOpen={!!inspectingTest}
        onClose={() => setInspectingTest(null)}
        targetUrl={targetUrl}
        actualStatus={getInspectingTestStatus(inspectingTest)}
      />
    </WorkspaceLayout>
  );
}

export default App;
