import pytest
import httpx
from backend.scanner.group_js_secrets import scan_js_secrets

@pytest.mark.asyncio
async def test_detects_vulnerable_bootstrap_in_js():
    js_content = """
    /*!
     * Bootstrap v3.4.0 (https://getbootstrap.com/)
     * Copyright 2011-2018 Twitter, Inc.
     */
    +function ($) { "use strict"; ... }(jQuery);
    """

    def handler(request: httpx.Request):
        return httpx.Response(200, text=js_content)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        crawler_data = {
            "base_url": "https://example.com",
            "js_scripts": ["https://example.com/js/bootstrap.3.4.0.min.js"],
            "discovered_endpoints": [],
        }
        findings = await scan_js_secrets(crawler_data, client)

    bootstrap_findings = [f for f in findings if f["id"] == "F-VULN-BOOTSTRAP"]
    assert len(bootstrap_findings) == 1
    assert "Bootstrap" in bootstrap_findings[0]["title"]
    assert bootstrap_findings[0]["severity"] == "HIGH"
    assert "CVE-2019-8331" in bootstrap_findings[0]["title"]

@pytest.mark.asyncio
async def test_detects_sourcemap_disclosure():
    def handler(request: httpx.Request):
        url = str(request.url)
        if url.endswith(".map"):
            return httpx.Response(200, text='{"version":3,"sources":["src/app.ts"],"mappings":"AAAA"}')
        return httpx.Response(200, text="console.log('main bundle');")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        crawler_data = {
            "base_url": "https://example.com",
            "js_scripts": ["https://example.com/bundle.js"],
            "discovered_endpoints": [],
        }
        findings = await scan_js_secrets(crawler_data, client)

    map_findings = [f for f in findings if f["id"] == "F-SOURCEMAP"]
    assert len(map_findings) == 1
    assert map_findings[0]["severity"] == "CRITICAL"
    assert "Source Map" in map_findings[0]["title"]

@pytest.mark.asyncio
async def test_extracts_ajax_endpoints_from_js():
    js_content = """
    function loadData() {
        $.ajax({ url: "WebAjax/evStudent_Load.aspx?id=123", type: "POST" });
        fetch('/api/v1/userData');
    }
    """

    def handler(request: httpx.Request):
        return httpx.Response(200, text=js_content)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        crawler_data = {
            "base_url": "https://example.com",
            "js_scripts": ["https://example.com/app.js"],
            "discovered_endpoints": [],
        }
        await scan_js_secrets(crawler_data, client)

    endpoints = crawler_data.get("discovered_endpoints", [])
    assert any("WebAjax/evStudent_Load.aspx" in ep for ep in endpoints)
    assert any("/api/v1/userData" in ep for ep in endpoints)
