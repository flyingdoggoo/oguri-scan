import { describe, it, expect, beforeEach } from "vitest";
import { getHistory, saveScanToHistory, removeHistoryItem, clearHistory } from "../lib/storage";
import type { SavedScan } from "../types/scan";

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

// Gán mock localStorage vào globalThis
(globalThis as any).localStorage = createLocalStorageMock();

describe("LocalStorage History Manager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trả về mảng rỗng khi chưa có lịch sử", () => {
    expect(getHistory()).toEqual([]);
  });

  it("lưu và đọc lại lượt quét thành công", () => {
    const item: SavedScan = {
      scan_id: "scan-001",
      target_url: "https://example.com",
      grade: "A",
      score: 95,
      timestamp: "2026-10-11T12:00:00Z",
      critical: 0,
      high: 0,
      medium: 1,
    };

    saveScanToHistory(item);
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].scan_id).toBe("scan-001");
    expect(history[0].grade).toBe("A");
  });

  it("giới hạn tối đa 10 lượt quét gần nhất", () => {
    for (let i = 1; i <= 15; i++) {
      saveScanToHistory({
        scan_id: `scan-${i}`,
        target_url: `https://site${i}.com`,
        grade: "B",
        score: 80,
        timestamp: new Date().toISOString(),
        critical: 0,
        high: 1,
        medium: 0,
      });
    }

    const history = getHistory();
    expect(history.length).toBe(10);
    // Mục mới nhất (15) nằm đầu danh sách
    expect(history[0].scan_id).toBe("scan-15");
  });

  it("xóa mục cụ thể theo scan_id", () => {
    const item1: SavedScan = {
      scan_id: "scan-001",
      target_url: "https://example1.com",
      grade: "A",
      score: 90,
      timestamp: "2026-10-11T12:00:00Z",
      critical: 0,
      high: 0,
      medium: 0,
    };
    const item2: SavedScan = {
      scan_id: "scan-002",
      target_url: "https://example2.com",
      grade: "F",
      score: 30,
      timestamp: "2026-10-11T12:05:00Z",
      critical: 2,
      high: 3,
      medium: 1,
    };

    saveScanToHistory(item1);
    saveScanToHistory(item2);

    const afterRemove = removeHistoryItem("scan-001");
    expect(afterRemove.length).toBe(1);
    expect(afterRemove[0].scan_id).toBe("scan-002");
  });

  it("xóa toàn bộ lịch sử", () => {
    saveScanToHistory({
      scan_id: "scan-001",
      target_url: "https://example.com",
      grade: "C",
      score: 55,
      timestamp: "2026-10-11T12:00:00Z",
      critical: 1,
      high: 1,
      medium: 1,
    });

    clearHistory();
    expect(getHistory()).toEqual([]);
  });
});
