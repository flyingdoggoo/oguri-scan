import { useState } from "react";
import type { ScanResult } from "../../types/scan";
import { Button } from "../ui/button";
import { Download, Printer, Share2, RotateCcw, ArrowLeft, Check } from "lucide-react";

interface ReportToolbarProps {
  scanResult: ScanResult;
  onReset: () => void;
  onRescan: (url: string) => void;
}

export function ReportToolbar({ scanResult, onReset, onRescan }: ReportToolbarProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleDownloadJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scanResult, null, 2));
      const downloadAnchor = document.createElement("a");
      let hostname = "domain";
      try {
        hostname = new URL(scanResult.target_url).hostname;
      } catch {}

      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `oguriscan-${hostname}-${scanResult.scan_id.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Lỗi xuất JSON:", e);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?scan_id=${scanResult.scan_id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl border border-white/[0.08] bg-[#0c0c0e]/80 backdrop-blur-md no-print my-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-zinc-300">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onRescan(scanResult.target_url)}
          className="gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Quét lại</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="gap-1.5">
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>JSON</span>
        </Button>

        <Button variant="outline" size="sm" onClick={handlePrintPDF} className="gap-1.5">
          <Printer className="w-3.5 h-3.5 text-zinc-400" />
          <span>In PDF</span>
        </Button>

        <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-1.5">
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã chép link</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Chia sẻ</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
