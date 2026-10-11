import asyncio
import time
from typing import Dict, Any, List, Callable, Awaitable, Optional
import httpx

from backend.core.config import DEFAULT_HEADERS, REQUEST_TIMEOUT
from backend.core.circuit_breaker import CircuitBreaker
from backend.core.database import update_scan_result
from backend.scanner.crawler import crawl_target
from backend.scanner.group_cookies_headers import scan_cookies_and_headers
from backend.scanner.group_tls_dns import scan_tls_and_dns
from backend.scanner.group_cors import scan_cors_and_info_disclosure
from backend.scanner.group_injection import scan_active_injection
from backend.scanner.group_js_secrets import scan_js_secrets

# Tổng số bài kiểm tra chuẩn hóa
TOTAL_DEFINED_TESTS = 28

def calculate_security_score(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Thuật toán tính điểm an ninh và xếp loại (Grade A-F).
    Điểm ban đầu: 100.
    Trừ điểm theo mức độ nghiêm trọng:
      - CRITICAL: -25 điểm / lỗi
      - HIGH:     -15 điểm / lỗi
      - MEDIUM:   -8 điểm / lỗi
      - LOW:      -3 điểm / lỗi
    """
    score = 100
    counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }

    for f in findings:
        sev = f.get("severity", "MEDIUM")
        if sev in counts:
            counts[sev] += 1

        if sev == "CRITICAL":
            score -= 25
        elif sev == "HIGH":
            score -= 15
        elif sev == "MEDIUM":
            score -= 8
        elif sev == "LOW":
            score -= 3

    score = max(0, min(100, score))

    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    failed_tests = len(findings)
    passed_tests = max(0, TOTAL_DEFINED_TESTS - failed_tests)

    return {
        "score": score,
        "grade": grade,
        "total_checks": TOTAL_DEFINED_TESTS,
        "total_tests": TOTAL_DEFINED_TESTS,
        "passed": passed_tests,
        "failed": failed_tests,
        "breakdown": counts,
        "critical": counts.get("CRITICAL", 0),
        "high": counts.get("HIGH", 0),
        "medium": counts.get("MEDIUM", 0),
        "low": counts.get("LOW", 0),
    }

# Bộ lưu trữ các scan_id đã bị người dùng hủy
cancelled_scans_set = set()

def cancel_active_scan(scan_id: str) -> None:
    cancelled_scans_set.add(scan_id)

async def execute_scan_pipeline(
    scan_id: str,
    target_url: str,
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
) -> Dict[str, Any]:
    """
    Thực thi toàn bộ quy trình quét bảo mật động bất đồng bộ:
    1. Crawl nhanh bề mặt tấn công.
    2. Chạy song song 6 nhóm kiểm tra thực chiến.
    3. Tổng hợp kết quả và cập nhật cơ sở dữ liệu.
    """
    start_time = time.time()
    circuit_breaker = CircuitBreaker()

    async def notify(
        progress: int,
        current_task: str,
        group_status: Optional[Dict[str, str]] = None,
        new_findings: Optional[List[Dict[str, Any]]] = None,
        event_type: str = "progress"
    ):
        if progress_callback:
            await progress_callback({
                "type": event_type,
                "scan_id": scan_id,
                "progress": progress,
                "current_task": current_task,
                "current_step": current_task,
                "group_status": group_status or {},
                "findings_count": len(new_findings or []),
                "findings": new_findings or [],
            })

    group_status = {
        "crawler": "running",
        "cookies_headers": "pending",
        "tls_dns": "pending",
        "cors_info": "pending",
        "injection": "pending",
        "js_secrets": "pending",
    }

    await notify(5, "Đang kết nối và thu thập liên kết nội bộ...", group_status)

    async with httpx.AsyncClient(
        headers=DEFAULT_HEADERS,
        verify=False,  # Cho phép quét cả trang có SSL tự ký để phát hiện lỗi
        timeout=REQUEST_TIMEOUT
    ) as client:
        # 1. Thu thập bề mặt tấn công (Crawl)
        crawler_data = await crawl_target(target_url, client)
        group_status["crawler"] = "completed"
        group_status["cookies_headers"] = "running"
        group_status["tls_dns"] = "running"
        group_status["cors_info"] = "running"
        group_status["injection"] = "running"
        group_status["js_secrets"] = "running"

        await notify(20, "Đang khởi chạy song song 5 nhóm kiểm tra bảo mật...", group_status)

        # 2. Khởi chạy song song 5 tác vụ
        task_ab = asyncio.create_task(scan_cookies_and_headers(target_url, client))
        task_c = asyncio.create_task(scan_tls_and_dns(target_url, client))
        task_d = asyncio.create_task(scan_cors_and_info_disclosure(target_url, client))
        task_e = asyncio.create_task(scan_active_injection(crawler_data, client, circuit_breaker))
        task_f = asyncio.create_task(scan_js_secrets(crawler_data, client))

        # Giám sát tiến độ giả lập đều đặn
        for p in [35, 50, 65, 80]:
            if scan_id in cancelled_scans_set:
                return {"scan_id": scan_id, "status": "CANCELLED"}
            await asyncio.sleep(0.4)
            await notify(p, "Đang kiểm tra lỗ hổng Injection & Khóa bí mật...", group_status)

        if scan_id in cancelled_scans_set:
            return {"scan_id": scan_id, "status": "CANCELLED"}

        # Chờ toàn bộ tác vụ hoàn tất
        results = await asyncio.gather(task_ab, task_c, task_d, task_e, task_f, return_exceptions=True)

        if scan_id in cancelled_scans_set:
            return {"scan_id": scan_id, "status": "CANCELLED"}

        all_findings: List[Dict[str, Any]] = []
        for r in results:
            if isinstance(r, list):
                all_findings.extend(r)

        for k in group_status:
            group_status[k] = "completed"

        await notify(95, "Đang tổng hợp dữ liệu và tính toán điểm an ninh...", group_status)

    if scan_id in cancelled_scans_set:
        return {"scan_id": scan_id, "status": "CANCELLED"}

    # 3. Tính điểm và lưu trữ
    recon_data = {
        "js_bundles": crawler_data.get("js_bundles_metadata", []),
        "discovered_endpoints": crawler_data.get("discovered_endpoints", []),
        "forms": crawler_data.get("forms", []),
        "total_js_scanned": len(crawler_data.get("js_scripts", [])),
    }

    summary = calculate_security_score(all_findings)
    summary["duration_seconds"] = round(time.time() - start_time, 2)
    summary["scanned_url"] = target_url
    summary["recon_data"] = recon_data

    await update_scan_result(
        scan_id=scan_id,
        status="COMPLETED",
        grade=summary["grade"],
        score=summary["score"],
        findings=all_findings,
        summary=summary
    )

    final_report = {
        "scan_id": scan_id,
        "url": target_url,
        "status": "COMPLETED",
        "summary": summary,
        "findings": all_findings,
        "recon_data": recon_data,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    await notify(100, "Hoàn tất quét bảo mật thành công!", group_status, all_findings, event_type="complete")
    return final_report
