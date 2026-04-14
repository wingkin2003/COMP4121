import os
from uuid import uuid4

from fastapi import APIRouter, Depends, UploadFile, File

from app.auth.dependencies import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/uploads/{filename}"}
