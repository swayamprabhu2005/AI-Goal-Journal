import threading
from datetime import datetime
from typing import Optional
from app.models.domain import GoogleCalendarToken

class InMemoryCalendarTokenRepository:
    def __init__(self):
        self._lock = threading.Lock()
        # Keyed by user_id -> GoogleCalendarToken
        self._tokens: dict[str, GoogleCalendarToken] = {}

    def save_token(self, token: GoogleCalendarToken) -> GoogleCalendarToken:
        with self._lock:
            token.updated_at = datetime.utcnow()
            self._tokens[token.user_id] = token
            return token

    def get_token_by_user(self, user_id: str) -> Optional[GoogleCalendarToken]:
        with self._lock:
            return self._tokens.get(user_id)

    def delete_token(self, user_id: str) -> bool:
        with self._lock:
            if user_id in self._tokens:
                del self._tokens[user_id]
                return True
            return False

calendar_token_repo = InMemoryCalendarTokenRepository()
