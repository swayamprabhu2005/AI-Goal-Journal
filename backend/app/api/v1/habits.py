from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.schemas.habit import (
    HabitCreate,
    HabitUpdate,
    HabitResponse,
    HabitLogResponse,
    HabitStatusResponse,
)
from app.services.habit_service import habit_service


router = APIRouter(
    prefix="/habits",
    tags=["Habits"]
)


@router.post(
    "",
    response_model=HabitResponse,
    status_code=status.HTTP_201_CREATED
)
def create_habit(
    payload: HabitCreate,
    current_user=Depends(get_current_user)
):
    return habit_service.create_habit(
        user_id=current_user.uid,
        name=payload.name,
        description=payload.description,
        frequency=payload.frequency,
    )


@router.get(
    "",
    response_model=list[HabitResponse]
)
def get_habits(
    current_user=Depends(get_current_user)
):
    return habit_service.get_habits(
        current_user.uid
    )


@router.get(
    "/{habit_id}",
    response_model=HabitResponse
)
def get_habit(
    habit_id: str,
    current_user=Depends(get_current_user)
):
    habit = habit_service.get_habit(
        current_user.uid,
        habit_id
    )

    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return habit


@router.put(
    "/{habit_id}",
    response_model=HabitResponse
)
def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    current_user=Depends(get_current_user)
):
    habit = habit_service.update_habit(
        current_user.uid,
        habit_id,
        **payload.model_dump(exclude_unset=True)
    )

    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return habit


@router.delete(
    "/{habit_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_habit(
    habit_id: str,
    current_user=Depends(get_current_user)
):
    deleted = habit_service.delete_habit(
        current_user.uid,
        habit_id
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return None


@router.post(
    "/{habit_id}/complete",
    response_model=HabitLogResponse,
    status_code=status.HTTP_201_CREATED
)
def complete_habit(
    habit_id: str,
    completed_date: Optional[datetime] = None,
    current_user=Depends(get_current_user)
):
    log = habit_service.complete_habit(
        current_user.uid,
        habit_id,
        completed_date
    )

    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return log


@router.delete(
    "/{habit_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT
)
def uncomplete_habit(
    habit_id: str,
    completed_date: Optional[datetime] = None,
    current_user=Depends(get_current_user)
):
    removed = habit_service.uncomplete_habit(
        current_user.uid,
        habit_id,
        completed_date
    )

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit completion not found"
        )

    return None


@router.get(
    "/{habit_id}/logs",
    response_model=list[HabitLogResponse]
)
def get_habit_logs(
    habit_id: str,
    current_user=Depends(get_current_user)
):
    habit = habit_service.get_habit(
        current_user.uid,
        habit_id
    )

    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return habit_service.get_logs(
        current_user.uid,
        habit_id
    )


@router.get(
    "/{habit_id}/status",
    response_model=HabitStatusResponse
)
def get_habit_status(
    habit_id: str,
    current_user=Depends(get_current_user)
):
    habit = habit_service.get_habit(
        current_user.uid,
        habit_id
    )

    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )

    return HabitStatusResponse(
        habit_id=habit_id,
        completed_today=habit_service.is_completed_today(
            current_user.uid,
            habit_id
        ),
        current_streak=habit_service.get_current_streak(
            current_user.uid,
            habit_id
        ),
    )