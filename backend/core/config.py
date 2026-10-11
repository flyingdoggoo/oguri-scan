import os
from pathlib import Path

# Thư mục gốc backend
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Cấu hình kiểm soát thời gian (Timeouts)
REQUEST_TIMEOUT: float = 5.0          # Tối đa 5s cho mỗi HTTP request
GLOBAL_SCAN_TIMEOUT: float = 60.0     # Tối đa 60s cho toàn bộ phiên scan

# Cấu hình giới hạn Crawler (Safety Guard)
MAX_CRAWL_DEPTH: int = 1              # Chỉ crawl trang chủ và link nội bộ trực tiếp
MAX_CRAWL_URLS: int = 10              # Tối đa 10 URL có params hoặc form
MAX_PARAMS_PER_URL: int = 3           # Tối đa 3 tham số trên mỗi endpoint
MAX_JS_FILES_TO_SCAN: int = 10        # Tối đa 10 file JS tĩnh để quét regex

# Cơ chế Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD: int = 5    # Hủy scan nếu gặp liên tiếp 5 mã lỗi 429 hoặc 503

# Cấu hình cơ sở dữ liệu SQLite
DB_PATH: Path = BACKEND_DIR / "local_scans.db"

# Headers mặc định giả lập trình duyệt (Tránh bị chặn bởi bot protection cơ bản)
DEFAULT_HEADERS: dict = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OguriScan/1.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
}
