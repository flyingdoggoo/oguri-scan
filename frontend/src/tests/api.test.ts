import { describe, it, expect, vi, beforeEach } from "vitest";
import { startScan, getScan, cancelScan } from "../lib/api";

describe("API Client functions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("startScan gửi POST request đúng payload và trả về scan_id", async () => {
    const mockResponse = { scan_id: "scan-xyz", status: "running" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await startScan("https://example.com");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/scans",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ target_url: "https://example.com" }),
      })
    );
    expect(result.scan_id).toBe("scan-xyz");
  });

  it("startScan ném lỗi khi server trả về mã lỗi HTTP", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: "URL không hợp lệ" }),
    } as Response);

    await expect(startScan("invalid-url")).rejects.toThrow("URL không hợp lệ");
  });

  it("getScan trả về kết quả chi tiết", async () => {
    const mockScanResult = {
      scan_id: "scan-123",
      target_url: "https://test.com",
      status: "completed",
      progress: 100,
      summary: { score: 85, grade: "B" },
      findings: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockScanResult,
    } as Response);

    const result = await getScan("scan-123");
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/scans/scan-123");
    expect(result.scan_id).toBe("scan-123");
  });

  it("cancelScan gửi POST request hủy quét", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);

    const success = await cancelScan("scan-123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/scans/scan-123/cancel",
      expect.objectContaining({ method: "POST" })
    );
    expect(success).toBe(true);
  });
});
