import asyncio
import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self._limit = limit
        self._window_seconds = window_seconds
        self._entries: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def allow(self, key: str) -> bool:
        now = time.monotonic()
        async with self._lock:
            entries = self._entries[key]
            while entries and now - entries[0] >= self._window_seconds:
                entries.popleft()
            if len(entries) >= self._limit:
                return False
            entries.append(now)
            return True


class InFlightRegistry:
    def __init__(self) -> None:
        self._ids: set[str] = set()
        self._lock = asyncio.Lock()

    async def add(self, request_id: str) -> bool:
        async with self._lock:
            if request_id in self._ids:
                return False
            self._ids.add(request_id)
            return True

    async def remove(self, request_id: str) -> None:
        async with self._lock:
            self._ids.discard(request_id)
