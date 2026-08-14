from abc import ABC, abstractmethod
from typing import Optional, Any
from app.models.domain import User, Goal, JournalEntry, WeeklySummary

class AbstractUserRepository(ABC):
    @abstractmethod
    def get_or_create(self, uid: str, email: str, name: Optional[str] = None) -> User:
        pass

    @abstractmethod
    def get_by_uid(self, uid: str) -> Optional[User]:
        pass

    @abstractmethod
    def update_profile(self, uid: str, display_name: Optional[str] = None, profession: Optional[str] = None) -> Optional[User]:
        pass

class AbstractGoalRepository(ABC):
    @abstractmethod
    def create(self, goal: Goal) -> Goal:
        pass

    @abstractmethod
    def get_by_id(self, user_id: str, goal_id: str) -> Optional[Goal]:
        pass

    @abstractmethod
    def get_all_by_user(self, user_id: str, status: Optional[str] = None) -> list[Goal]:
        pass

    @abstractmethod
    def update(self, user_id: str, goal_id: str, **kwargs) -> Optional[Goal]:
        pass

    @abstractmethod
    def delete(self, user_id: str, goal_id: str) -> bool:
        pass

class AbstractJournalRepository(ABC):
    @abstractmethod
    def create(self, journal: JournalEntry) -> JournalEntry:
        pass

    @abstractmethod
    def get_by_id(self, user_id: str, journal_id: str) -> Optional[JournalEntry]:
        pass

    @abstractmethod
    def get_all_by_user(self, user_id: str) -> list[JournalEntry]:
        pass

    @abstractmethod
    def update(self, user_id: str, journal_id: str, content: str) -> Optional[JournalEntry]:
        pass

    @abstractmethod
    def delete(self, user_id: str, journal_id: str) -> bool:
        pass

class AbstractSummaryRepository(ABC):
    @abstractmethod
    def save(self, summary: WeeklySummary) -> WeeklySummary:
        pass

    @abstractmethod
    def get_latest_by_user(self, user_id: str) -> Optional[WeeklySummary]:
        pass
