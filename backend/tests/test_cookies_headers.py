import pytest
import httpx
from unittest.mock import AsyncMock
from backend.scanner.group_cookies_headers import scan_cookies_and_headers

@pytest.mark.asyncio
async def test_detects_insecure_cookie():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    # Giả lập response trả về cookie thiếu HttpOnly, Secure, SameSite
    mock_response = httpx.Response(
        status_code=200,
        headers={"Set-Cookie": "session_id=12345; Path=/"},
        request=httpx.Request("GET", "https://example.com")
    )
    mock_client.get.return_value = mock_response

    findings = await scan_cookies_and_headers("https://example.com", mock_client)

    finding_ids = [f["id"] for f in findings]
    assert "A1" in finding_ids  # Thiếu HttpOnly
    assert "A2" in finding_ids  # Thiếu Secure
    assert "A3" in finding_ids  # Thiếu SameSite

@pytest.mark.asyncio
async def test_detects_missing_headers():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    # Giả lập response không có bất kỳ header bảo mật nào
    mock_response = httpx.Response(
        status_code=200,
        headers={"Content-Type": "text/html"},
        request=httpx.Request("GET", "https://example.com")
    )
    mock_client.get.return_value = mock_response

    findings = await scan_cookies_and_headers("https://example.com", mock_client)

    finding_ids = [f["id"] for f in findings]
    assert "B1" in finding_ids  # Thiếu CSP
    assert "B3" in finding_ids  # Thiếu X-Frame-Options (Clickjacking)
    assert "B4" in finding_ids  # Thiếu HSTS
    assert "B5" in finding_ids  # Thiếu nosniff
