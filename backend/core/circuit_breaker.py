from backend.core.config import CIRCUIT_BREAKER_THRESHOLD

class CircuitBreakerOpenException(Exception):
    """Ngoại lệ ném ra khi mạch bị ngắt để bảo vệ server mục tiêu."""
    pass

class CircuitBreaker:
    """
    Cơ chế bảo vệ: Đếm số lỗi liên tiếp 429 (Too Many Requests) hoặc 503 (Service Unavailable).
    Nếu vượt quá ngưỡng, tự động ngắt toàn bộ các bài test injection tiếp theo.
    """
    def __init__(self, threshold: int = CIRCUIT_BREAKER_THRESHOLD):
        self.threshold: int = threshold
        self.consecutive_errors: int = 0
        self.is_open: bool = False
        self.reason: str = ""

    def record_response(self, status_code: int) -> None:
        """Ghi nhận mã phản hồi HTTP từ server mục tiêu."""
        if status_code in (429, 503):
            self.consecutive_errors += 1
            if self.consecutive_errors >= self.threshold:
                self.is_open = True
                self.reason = f"Mục tiêu trả về liên tiếp {self.consecutive_errors} lỗi HTTP {status_code} (Rate limited hoặc quá tải)."
        else:
            # Nhận response bình thường (200, 301, 404, 500,...) -> Reset đếm lỗi liên tiếp
            self.consecutive_errors = 0

    def check_state(self) -> None:
        """Kiểm tra xem mạch có đang ngắt không, nếu có thì ném lỗi dừng tiến trình."""
        if self.is_open:
            raise CircuitBreakerOpenException(f"Circuit Breaker đã ngắt: {self.reason}")

    def reset(self) -> None:
        """Đặt lại trạng thái ban đầu."""
        self.consecutive_errors = 0
        self.is_open = False
        self.reason = ""
