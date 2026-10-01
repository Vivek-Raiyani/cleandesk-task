import os
import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from routes.users import users_router
from routes.timesheet import timesheet_router
from routes.notifications import notifications_router
from routes.ai import ai_router
from routes.operations import operations_router
from routes.websockets import ws_router
from core.settings import settings
from core.database import create_database


app = FastAPI(
    title="CleanDesk AI",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api")
app.include_router(timesheet_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(operations_router, prefix="/api")
app.include_router(ws_router)

@app.get("/")
def root():
    return {"status": "ok"}
