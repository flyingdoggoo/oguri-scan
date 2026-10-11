import pytest
import httpx
from unittest.mock import AsyncMock
from backend.scanner.group_js_secrets import scan_js_secrets

@pytest.mark.asyncio
async def test_detects_aws_key_and_stripe_secret_in_js():
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    crawler_data = {
        "js_scripts": ["https://example.com/assets/app.js"]
    }

    # Tách chuỗi mẫu giả lập để tránh GitHub Secret Scanning Push Protection nhận diện nhầm
    fake_aws_key = "AKIA" + "IOSFODNN7EXAMPLE"
    fake_stripe_key = "sk_" + "live_51Abcdefghijklmnopqrstuv"

    js_content = f"""
    const config = {{
        awsAccessKeyId: "{fake_aws_key}",
        stripeApiKey: "{fake_stripe_key}",
        publicApp: true
    }};
    """

    mock_client.get.return_value = httpx.Response(
        status_code=200,
        text=js_content,
        request=httpx.Request("GET", "https://example.com/assets/app.js")
    )

    findings = await scan_js_secrets(crawler_data, mock_client)

    finding_ids = [f["id"] for f in findings]
    assert "F1" in finding_ids  # AWS Key
    assert "F4" in finding_ids  # Stripe Key

    # Kiểm tra xem bằng chứng có bị mask secret không
    for f in findings:
        assert fake_aws_key not in f["evidence"]  # Đã bị che bớt
