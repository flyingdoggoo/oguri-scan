import json
import aiosqlite
from typing import Optional, Dict, Any, List
from backend.core.config import DB_PATH

async def init_db() -> None:
    """Khởi tạo cấu trúc bảng SQLite nếu chưa tồn tại."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                status TEXT NOT NULL,
                grade TEXT,
                score INTEGER,
                findings_json TEXT DEFAULT '[]',
                summary_json TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

async def create_scan(scan_id: str, url: str) -> None:
    """Tạo bản ghi lượt quét mới với trạng thái PENDING."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO scans (id, url, status, findings_json, summary_json) VALUES (?, ?, ?, ?, ?)",
            (scan_id, url, "PENDING", "[]", "{}")
        )
        await db.commit()

async def update_scan_result(
    scan_id: str,
    status: str,
    grade: Optional[str] = None,
    score: Optional[int] = None,
    findings: Optional[List[Dict[str, Any]]] = None,
    summary: Optional[Dict[str, Any]] = None
) -> None:
    """Cập nhật kết quả quét hoàn tất hoặc trạng thái tiến độ."""
    findings_str = json.dumps(findings or [], ensure_ascii=False)
    summary_str = json.dumps(summary or {}, ensure_ascii=False)
    
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            UPDATE scans
            SET status = ?, grade = ?, score = ?, findings_json = ?, summary_json = ?
            WHERE id = ?
            """,
            (status, grade, score, findings_str, summary_str, scan_id)
        )
        await db.commit()

async def get_scan(scan_id: str) -> Optional[Dict[str, Any]]:
    """Lấy chi tiết 1 lượt quét theo mã ID."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "url": row["url"],
                "status": row["status"],
                "grade": row["grade"],
                "score": row["score"],
                "findings": json.loads(row["findings_json"] or "[]"),
                "summary": json.loads(row["summary_json"] or "{}"),
                "created_at": row["created_at"]
            }

async def list_recent_scans(limit: int = 10) -> List[Dict[str, Any]]:
    """Lấy danh sách các lượt quét gần đây nhất."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, url, status, grade, score, created_at FROM scans ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": row["id"],
                    "url": row["url"],
                    "status": row["status"],
                    "grade": row["grade"],
                    "score": row["score"],
                    "created_at": row["created_at"]
                }
                for row in rows
            ]
