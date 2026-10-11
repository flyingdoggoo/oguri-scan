import pytest
import httpx
from unittest.mock import AsyncMock
from backend.scanner.group_cors import scan_cors_and_info_disclosure

@pytest.mark.asyncio
async def test_detects_dangerous_cors_reflection():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    
    # Giả lập response phản chiếu Origin tùy ý kèm ACAC=true
    cors_evil_response = httpx.Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "https://evil-attacker.com",
            "Access-Control-Allow-Credentials": "true"
        },
        request=httpx.Request("GET", "https://example.com")
    )
    
    # Response bình thường cho các probe khác
    normal_response = httpx.Response(
        status_code=404,
        text="Not found",
        request=httpx.Request("GET", "https://example.com")
    )

    mock_client.get.side_effect = [cors_evil_response, normal_response, normal_response, normal_response, normal_response, normal_response]

    findings = await scan_cors_and_info_disclosure("https://example.com", mock_client)

    finding_ids = [f["id"] for f in findings]
    assert "D1" in finding_ids
    critical_findings = [f for f in findings if f["id"] == "D1" and f["severity"] == "CRITICAL"]
    assert len(critical_findings) == 1
