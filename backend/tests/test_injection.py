import pytest
import httpx
from unittest.mock import AsyncMock
from backend.core.circuit_breaker import CircuitBreaker
from backend.scanner.group_injection import scan_active_injection

@pytest.mark.asyncio
async def test_detects_sqli_error_syntax():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    circuit_breaker = CircuitBreaker()

    crawler_data = {
        "urls_with_params": [
            {
                "endpoint": "https://example.com/search",
                "full_url": "https://example.com/search?q=test",
                "params": ["q"]
            }
        ]
    }

    # Giả lập response trả về lỗi MySQL khi tiêm dấu nháy
    def side_effect_mock(url, **kwargs):
        url_str = str(url)
        if "%27" in url_str or "'" in url_str:
            return httpx.Response(
                status_code=500,
                text="Database error: You have an error in your SQL syntax near ''' at line 1",
                request=httpx.Request("GET", url)
            )
        return httpx.Response(status_code=200, text="Normal search result", request=httpx.Request("GET", url))

    mock_client.get.side_effect = side_effect_mock

    findings = await scan_active_injection(crawler_data, mock_client, circuit_breaker)

    sqli_findings = [f for f in findings if f["id"] == "E3"]
    assert len(sqli_findings) == 1
    assert sqli_findings[0]["severity"] == "CRITICAL"
    assert "MySQL" in sqli_findings[0]["title"]
