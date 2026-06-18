from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    if payload.username != settings.admin_username or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(payload.username))
