from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    firebase_uid: str
    email: str
    display_name: str | None = None
    profession: str | None = None
    created_at: datetime = datetime.utcnow()