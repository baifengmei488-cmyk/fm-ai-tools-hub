from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin_tools import router as admin_tools_router
from app.api.routes.auth import router as auth_router
from app.api.routes.imports import router as imports_router
from app.api.routes.page_content import router as page_content_router
from app.api.routes.public_tools import router as public_tools_router
from app.api.routes.update_logs import router as update_logs_router
from app.core.config import settings

app = FastAPI(title="FM AI Tools Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(public_tools_router)
app.include_router(admin_tools_router)
app.include_router(imports_router)
app.include_router(update_logs_router)
app.include_router(page_content_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
