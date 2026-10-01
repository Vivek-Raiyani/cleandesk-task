from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.websockets import manager

ws_router = APIRouter()

@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Connect via WebSocket to receive real-time events.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
