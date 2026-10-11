from backend.scanner.orchestrator import calculate_security_score

def test_scoring_perfect_website():
    # Không có lỗ hổng nào -> Đạt 100 điểm, Grade A
    findings = []
    res = calculate_security_score(findings)
    assert res["score"] == 100
    assert res["grade"] == "A"
    assert res["failed"] == 0
    assert res["passed"] == 28

def test_scoring_with_critical_issues():
    # 2 lỗi CRITICAL (-25 x 2 = -50 điểm) -> Còn 50 điểm, Grade D
    findings = [
        {"severity": "CRITICAL", "title": "SQL Injection"},
        {"severity": "CRITICAL", "title": "Subdomain Takeover"},
    ]
    res = calculate_security_score(findings)
    assert res["score"] == 50
    assert res["grade"] == "D"
    assert res["breakdown"]["CRITICAL"] == 2

def test_scoring_floor_at_zero():
    # Quá nhiều lỗi -> Điểm không bị âm, tối thiểu là 0, Grade F
    findings = [
        {"severity": "CRITICAL"} for _ in range(5)
    ]
    res = calculate_security_score(findings)
    assert res["score"] == 0
    assert res["grade"] == "F"
