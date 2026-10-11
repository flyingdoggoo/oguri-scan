import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from backend.local_server import app, format_scan_record
from backend.core.database import init_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Tự động khởi tạo database bảng scans trước khi chạy test."""
    asyncio.run(init_db())

@pytest.fixture(autouse=True)
def mock_scanner():
    """Mock execute_scan_pipeline để unit test không gửi HTTP request thật ra internet."""
    with patch("backend.local_server.execute_scan_pipeline", new_callable=AsyncMock) as m:
        m.return_value = {"status": "COMPLETED"}
        yield m

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    """Kiểm tra endpoint /api/health trả về 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "OguriScan" in data["service"]

def test_format_scan_record_normalizes_summary():
    """Kiểm tra format_scan_record làm phẳng chính xác các chỉ số an ninh cho Frontend."""
    raw_record = {
        "id": "scan-abc123",
        "url": "https://sec-test.vn",
        "status": "COMPLETED",
        "grade": "B",
        "score": 75,
        "created_at": "2026-10-11 12:00:00",
        "findings": [
            {"id": "test-1", "severity": "HIGH", "name": "Missing HSTS"}
        ],
        "summary": {
            "score": 75,
            "grade": "B",
            "total_checks": 28,
            "passed": 27,
            "breakdown": {
                "CRITICAL": 0,
                "HIGH": 1,
                "MEDIUM": 0,
                "LOW": 0
            }
        }
    }

    formatted = format_scan_record(raw_record)
    assert formatted["scan_id"] == "scan-abc123"
    assert formatted["target_url"] == "https://sec-test.vn"
    assert formatted["status"] == "completed"
    assert formatted["summary"]["score"] == 75
    assert formatted["summary"]["grade"] == "B"
    assert formatted["summary"]["high"] == 1
    assert formatted["summary"]["critical"] == 0
    assert formatted["summary"]["total_tests"] == 28
    assert formatted["start_time"] == "2026-10-11 12:00:00"

def test_submit_scan_with_target_url(client):
    """Kiểm tra submit_scan tiếp nhận payload target_url của Frontend."""
    response = client.post("/api/scans", json={"target_url": "https://example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["target_url"] == "https://example.com"
    assert data["status"] == "pending"

def test_submit_scan_with_url(client):
    """Kiểm tra submit_scan tiếp nhận cả payload url truyền thống."""
    response = client.post("/api/scans", json={"url": "https://google.com"})
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["target_url"] == "https://google.com"

def test_submit_scan_invalid_url(client):
    """Kiểm tra submit_scan từ chối URL rỗng hoặc không có tên miền."""
    res1 = client.post("/api/scans", json={})
    assert res1.status_code == 400

    res2 = client.post("/api/scans", json={"target_url": "   "})
    assert res2.status_code == 400

def test_cancel_scan_endpoint(client):
    """Kiểm tra endpoint hủy phiên quét khẩn cấp."""
    # Khởi tạo 1 lượt quét
    create_res = client.post("/api/scans", json={"target_url": "https://test-cancel.com"})
    scan_id = create_res.json()["scan_id"]

    # Hủy lượt quét
    cancel_res = client.post(f"/api/scans/{scan_id}/cancel")
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()
    assert cancel_data["scan_id"] == scan_id
    assert cancel_data["status"] == "cancelled"

    # Kiểm tra chi tiết lượt quét đã đổi sang cancelled
    get_res = client.get(f"/api/scans/{scan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "cancelled"

def test_get_scan_not_found(client):
    """Kiểm tra truy vấn ID không tồn tại trả về 404."""
    res = client.get("/api/scans/non-existent-id")
    assert res.status_code == 404
