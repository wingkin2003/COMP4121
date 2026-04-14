from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    ProfileUpdate,
)
from app.auth.service import (
    register_user,
    authenticate_user,
    create_access_token,
    update_user,
)
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    try:
        await register_user(body.username, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    token = create_access_token(body.username)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await authenticate_user(body.username, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(body.username)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    return UserOut(
        username=user["username"],
        email=user.get("email", ""),
        created_at=user.get("created_at", ""),
    )


@router.patch("/me", response_model=UserOut)
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {}
    if body.email is not None:
        updates["email"] = body.email
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = await update_user(user["username"], updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(
        username=updated["username"],
        email=updated.get("email", ""),
        created_at=updated.get("created_at", ""),
    )
