import type { ScanEvent, ScanResult } from "../types/scan";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function startScan(targetUrl: string): Promise<{ scan_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/api/scans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target_url: targetUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Không thể khởi tạo lượt quét" }));
    throw new Error(errorData.detail || `Lỗi HTTP: ${response.status}`);
  }

  return response.json();
}

export async function getScan(scanId: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/api/scans/${scanId}`);
  if (!response.ok) {
    throw new Error(`Không tìm thấy kết quả quét (${response.status})`);
  }
  return response.json();
}

export async function cancelScan(scanId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/scans/${scanId}/cancel`, {
      method: "POST",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function streamScan(
  scanId: string,
  onEvent: (event: ScanEvent) => void,
  onComplete: () => void,
  onError: (err: any) => void
): () => void {
  const url = `${API_BASE}/api/scans/${scanId}/stream`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const data: ScanEvent = JSON.parse(e.data);
      onEvent(data);

      if (data.type === "complete" || data.type === "error") {
        eventSource.close();
        onComplete();
      }
    } catch (err) {
      console.error("Lỗi parse SSE message:", err, e.data);
    }
  };

  eventSource.onerror = (err) => {
    console.warn("SSE connection error or closed:", err);
    eventSource.close();
    onError(err);
  };

  return () => {
    eventSource.close();
  };
}
