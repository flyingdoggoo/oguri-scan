import pytest
from backend.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException

def test_circuit_breaker_normal_traffic():
    cb = CircuitBreaker(threshold=3)
    # Các mã phản hồi bình thường không kích hoạt ngắt mạch
    cb.record_response(200)
    cb.record_response(404)
    cb.record_response(500)
    assert not cb.is_open
    cb.check_state()  # Không ném lỗi

def test_circuit_breaker_tripping_on_consecutive_errors():
    cb = CircuitBreaker(threshold=3)
    cb.record_response(429)
    assert not cb.is_open
    cb.record_response(429)
    assert not cb.is_open
    cb.record_response(503)
    # Lỗi liên tiếp thứ 3 đạt threshold -> Ngắt mạch
    assert cb.is_open
    
    with pytest.raises(CircuitBreakerOpenException):
        cb.check_state()

def test_circuit_breaker_resets_on_success():
    cb = CircuitBreaker(threshold=3)
    cb.record_response(429)
    cb.record_response(429)
    # Nhận phản hồi thành công -> Reset đếm
    cb.record_response(200)
    assert cb.consecutive_errors == 0
    assert not cb.is_open
