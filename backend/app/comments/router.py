from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.comments.schemas import CommentCreate, CommentOut
from app.comments.service import add_comment, get_comments

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "product_id": doc["product_id"],
        "user_account": doc.get("user_account", ""),
        "text": doc.get("text", ""),
        "parent_id": doc.get("parent_id"),
        "created_at": doc.get("created_at", ""),
        "replies": [_to_out(r) for r in doc.get("replies", [])],
    }


@router.get("/{product_id}/comments", response_model=list[CommentOut])
async def list_comments(product_id: str):
    docs = await get_comments(product_id)
    return [_to_out(d) for d in docs]


@router.post("/{product_id}/comments", response_model=CommentOut, status_code=201)
async def create_comment(
    product_id: str, body: CommentCreate, user: dict = Depends(get_current_user)
):
    doc = await add_comment(product_id, user["username"], body.text, body.parent_id)
    doc["replies"] = []
    return _to_out(doc)
