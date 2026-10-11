import sys
from pathlib import Path

# Đảm bảo thư mục gốc dự án luôn nằm trong sys.path dù chạy từ bất kỳ đâu
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import asyncio
import uuid
import json
import urllib.parse
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.core.database import init_db, create_scan, get_scan, list_recent_scans, update_scan_result
from backend.scanner.orchestrator import execute_scan_pipeline, cancel_active_scan

# Quản lý hàng đợi SSE sự kiện thời gian thực theo từng scan_id
active_event_queues: Dict[str, asyncio.Queue] = {}

def normalize_finding(f: Dict[str, Any]) -> Dict[str, Any]:
    name = f.get("name") or f.get("title") or "Lỗ hổng bảo mật"
    group = f.get("group") or f.get("category") or "An ninh Website"
    desc = f.get("description") or f.get("impact") or ""
    affected = f.get("affected_url") or f.get("target") or ""

    remed = f.get("remediation")
    code_snippet = f.get("code_snippet")
    remediation_text = ""
    if isinstance(remed, dict):
        remediation_text = remed.get("explanation", "")
        if not code_snippet:
            code_snippet = remed.get("good_code") or ""
    elif isinstance(remed, str):
        remediation_text = remed

    cwe_id = f.get("cwe_id") or f.get("cwe")
    if not cwe_id:
        lower_name = name.lower()
        if "csp" in lower_name or "content-security-policy" in lower_name:
            cwe_id = "CWE-1021"
        elif "clickjacking" in lower_name or "x-frame-options" in lower_name:
            cwe_id = "CWE-1021"
        elif "hsts" in lower_name or "strict-transport-security" in lower_name:
            cwe_id = "CWE-319"
        elif "x-content-type-options" in lower_name or "mime" in lower_name:
            cwe_id = "CWE-430"
        elif "cookie" in lower_name:
            cwe_id = "CWE-614"
        elif "cors" in lower_name:
            cwe_id = "CWE-346"
        elif "sql" in lower_name:
            cwe_id = "CWE-89"
        elif "xss" in lower_name:
            cwe_id = "CWE-79"
        elif "traversal" in lower_name or "lfi" in lower_name:
            cwe_id = "CWE-22"
        elif "redirect" in lower_name:
            cwe_id = "CWE-601"
        elif "secret" in lower_name or "key" in lower_name or "jwt" in lower_name:
            cwe_id = "CWE-798"
        elif "tls" in lower_name or "ssl" in lower_name or "cipher" in lower_name:
            cwe_id = "CWE-326"

    return {
        "id": f.get("id", ""),
        "name": name,
        "title": name,
        "group": group,
        "category": group,
        "severity": f.get("severity", "MEDIUM"),
        "cwe_id": cwe_id or "",
        "description": desc,
        "impact": desc,
        "evidence": f.get("evidence", ""),
        "remediation": remediation_text,
        "code_snippet": code_snippet or "",
        "affected_url": affected,
        "target": affected,
    }

def format_scan_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chuẩn hóa dữ liệu bản ghi từ SQLite cho phù hợp 100% với Frontend TypeScript interface (ScanResult & ScanSummary).
    """
    summary = record.get("summary") or {}
    breakdown = summary.get("breakdown") or {}

    total_tests = summary.get("total_tests") or summary.get("total_checks") or 28
    score = summary.get("score") if summary.get("score") is not None else (record.get("score") if record.get("score") is not None else 100)
    grade = summary.get("grade") or record.get("grade") or "A"

    raw_findings = record.get("findings") or []
    normalized_findings = [normalize_finding(f) for f in raw_findings]

    flattened_summary = {
        "score": score,
        "grade": grade,
        "critical": breakdown.get("CRITICAL", summary.get("critical", 0)),
        "high": breakdown.get("HIGH", summary.get("high", 0)),
        "medium": breakdown.get("MEDIUM", summary.get("medium", 0)),
        "low": breakdown.get("LOW", summary.get("low", 0)),
        "passed": summary.get("passed", max(0, total_tests - len(normalized_findings))),
        "total_tests": total_tests,
    }

    scan_id = record.get("id") or record.get("scan_id") or ""
    raw_status = record.get("status", "PENDING").upper()

    return {
        "scan_id": scan_id,
        "target_url": record.get("url") or record.get("target_url") or "",
        "status": raw_status.lower(),
        "progress": 100 if raw_status in ("COMPLETED", "FAILED", "CANCELLED") else 50,
        "current_step": "Hoàn tất rà soát!" if raw_status == "COMPLETED" else f"Trạng thái: {raw_status}",
        "start_time": record.get("created_at") or "",
        "end_time": record.get("created_at") or "",
        "summary": flattened_summary,
        "findings": normalized_findings,
        "recon_data": summary.get("recon_data") or record.get("recon_data") or {},
    }

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo bảng SQLite khi server khởi động
    await init_db()
    yield

app = FastAPI(
    title="OguriScan API",
    description="Backend API công cụ quét an ninh mạng website động (DAST)",
    version="1.0.0",
    lifespan=lifespan
)

# Cho phép giao tiếp CORS với Frontend Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    # Chấp nhận cả 2 định dạng target_url và url để tương thích tuyệt đối
    target_url: Optional[str] = None
    url: Optional[str] = None

@app.get("/api/health")
async def health_check():
    """Kiểm tra trạng thái hoạt động của server."""
    return {"status": "ok", "service": "OguriScan Backend"}

@app.post("/api/scans")
async def submit_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    """
    Tiếp nhận yêu cầu quét URL mới.
    Khởi tạo scan_id và kích hoạt tiến trình chạy ngầm.
    """
    raw = req.target_url or req.url
    if not raw or not raw.strip():
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp địa chỉ URL cần quét (target_url).")

    raw_url = raw.strip()
    if not raw_url.startswith(("http://", "https://")):
        raw_url = "https://" + raw_url

    parsed = urllib.parse.urlparse(raw_url)
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="URL không hợp lệ. Vui lòng nhập đúng định dạng tên miền.")

    scan_id = uuid.uuid4().hex[:12]
    await create_scan(scan_id, raw_url)

    # Khởi tạo Queue nhận thông báo cho SSE
    queue = asyncio.Queue()
    active_event_queues[scan_id] = queue

    async def progress_hook(event_data: Dict[str, Any]):
        if scan_id in active_event_queues:
            payload = {
                "type": event_data.get("type", "progress"),
                "scan_id": scan_id,
                "progress": event_data.get("progress", 0),
                "current_step": event_data.get("current_step") or event_data.get("current_task", ""),
                "group_status": event_data.get("group_status"),
                "findings": event_data.get("findings", []),
            }
            if payload["progress"] >= 100 or event_data.get("type") == "complete":
                payload["type"] = "complete"
            await active_event_queues[scan_id].put(payload)

    async def run_scan_worker():
        try:
            await execute_scan_pipeline(scan_id, raw_url, progress_callback=progress_hook)
        except Exception as e:
            await update_scan_result(scan_id, status="FAILED", summary={"error": str(e)})
            if scan_id in active_event_queues:
                await active_event_queues[scan_id].put({
                    "type": "error",
                    "scan_id": scan_id,
                    "status": "FAILED",
                    "error": str(e)
                })

    # Kích hoạt worker chạy nền
    background_tasks.add_task(run_scan_worker)

    return {
        "scan_id": scan_id,
        "target_url": raw_url,
        "url": raw_url,
        "status": "pending"
    }

@app.post("/api/scans/{scan_id}/cancel")
async def cancel_scan_endpoint(scan_id: str):
    """Hủy phiên quét đang thực thi khẩn cấp."""
    record = await get_scan(scan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt quét cần hủy.")

    cancel_active_scan(scan_id)
    await update_scan_result(scan_id, status="CANCELLED")

    if scan_id in active_event_queues:
        await active_event_queues[scan_id].put({
            "type": "error",
            "scan_id": scan_id,
            "status": "CANCELLED",
            "error": "Phiên quét đã được hủy khẩn cấp."
        })

    return {"scan_id": scan_id, "status": "cancelled", "message": "Đã hủy phiên quét thành công."}

@app.get("/api/scans/{scan_id}/stream")
async def stream_scan_progress(scan_id: str):
    """
    Server-Sent Events (SSE) Endpoint:
    Truyền dữ liệu tiến độ thời gian thực (0% - 100%) trực tiếp lên giao diện người dùng.
    """
    record = await get_scan(scan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt quét.")

    # Nếu đã hoàn thành trước đó, trả về sự kiện hoàn tất ngay lập tức
    if record["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
        async def immediate_generator():
            formatted = format_scan_record(record)
            yield json.dumps({
                "type": "complete" if record["status"] == "COMPLETED" else "error",
                "scan_id": scan_id,
                "progress": 100,
                "current_step": "Hoàn tất rà soát!",
                "status": record["status"].lower(),
                "report": formatted,
                "summary": formatted["summary"],
                "findings": formatted["findings"],
                "error": "Phiên quét đã kết thúc hoặc bị hủy." if record["status"] != "COMPLETED" else None,
            }, ensure_ascii=False)
        return EventSourceResponse(immediate_generator())

    queue = active_event_queues.get(scan_id)
    if not queue:
        queue = asyncio.Queue()
        active_event_queues[scan_id] = queue

    async def event_generator():
        try:
            while True:
                # Đợi sự kiện tiếp theo tối đa 25s để tránh ngắt kết nối
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield json.dumps(data, ensure_ascii=False)
                    if data.get("type") in ("complete", "error") or data.get("progress") == 100:
                        break
                except asyncio.TimeoutError:
                    # Gửi heartbeat giữ kết nối SSE
                    yield json.dumps({"heartbeat": True})
        finally:
            active_event_queues.pop(scan_id, None)

    return EventSourceResponse(event_generator())

@app.get("/api/scans/{scan_id}")
async def get_scan_details(scan_id: str):
    """Lấy toàn bộ kết quả báo cáo của 1 lượt quét cụ thể chuẩn hóa cho Frontend."""
    record = await get_scan(scan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi lượt quét.")
    return format_scan_record(record)

@app.get("/api/scans")
async def list_scans():
    """Lấy danh sách 10 lượt quét gần đây nhất."""
    raw_list = await list_recent_scans(limit=10)
    return [format_scan_record(item) for item in raw_list]

if __name__ == "__main__":
    import uvicorn
    # Chạy instance app trực tiếp
    uvicorn.run(app, host="0.0.0.0", port=8000)
