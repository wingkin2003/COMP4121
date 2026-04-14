from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1)
    parent_id: str | None = None


class CommentOut(BaseModel):
    id: str
    product_id: str
    user_account: str
    text: str
    parent_id: str | None = None
    created_at: str
    replies: list["CommentOut"] = []
