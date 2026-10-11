import type { SavedScan } from "../types/scan";

const STORAGE_KEY = "oguriscan_history_v1";
const MAX_HISTORY = 10;

export function getHistory(): SavedScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Lỗi đọc lịch sử quét từ localStorage:", e);
    return [];
  }
}

export function saveScanToHistory(item: SavedScan): void {
  try {
    const current = getHistory();
    // Bỏ item cũ nếu trùng scan_id
    const filtered = current.filter((x) => x.scan_id !== item.scan_id);
    const updated = [item, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi lưu lịch sử quét vào localStorage:", e);
  }
}

export function removeHistoryItem(scanId: string): SavedScan[] {
  try {
    const current = getHistory();
    const updated = current.filter((x) => x.scan_id !== scanId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Lỗi xóa mục lịch sử:", e);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Lỗi xóa toàn bộ lịch sử:", e);
  }
}
