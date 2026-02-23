import asyncio
import json
from typing import AsyncGenerator

class SSEQueue:
    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    def publish(self, event: dict):
        for q in self._subscribers:
            q.put_nowait(event)

    async def listen(self) -> AsyncGenerator[str, None]:
        """Must be used with `async for` in FastAPI route."""
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        try:
            while True:
                event = await q.get()
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass                        # client disconnected
        finally:
            self._subscribers.remove(q)

sse_queue = SSEQueue()
