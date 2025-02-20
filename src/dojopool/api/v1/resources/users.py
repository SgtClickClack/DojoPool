from flask_caching import Cache
from flask_caching import Cache
"""User resources module.

This module provides API resources for user operations.
"""

from typing import Any, Dict, List, Optional, Tuple, Union, cast

from flask import current_app, request
from flask_login import current_user
from marshmallow import Schema, fields, validate, validates_schema
from marshmallow.validate import Length, Range
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.exceptions import AuthorizationError, NotFoundError, ValidationError
from dojopool.core.security import require_auth, require_roles
from dojopool.models.user import User

from .base import BaseResource


class UserSchema(Schema):
    """Schema for user data serialization."""

    id = fields.Integer(dump_only=True)
    email: Any = fields.Email(dump_only=True)
    username: Any = fields.String(dump_only=True)
    first_name: Any = fields.String()
    last_name: Any = fields.String()
    is_active: Any = fields.Boolean(dump_only=True)
    created_at: Any = fields.DateTime(dump_only=True)
    updated_at: Any = fields.DateTime(dump_only=True)


class UserUpdateSchema(Schema):
    """Schema for user update data validation."""

    first_name: Any = fields.String(required=False)
    last_name: Any = fields.String(required=False)
    current_password: Any = fields.String(required=False)
    new_password: Any = fields.String(required=False)
    confirm_new_password: Any = fields.String(required=False)

    @validates_schema
    def validate_password_update(self, data: Dict[str, Any], **kwargs: Any) -> None:
        """Validate password update fields."""
        password_fields: List[Any] = ["new_password", "confirm_new_password"]
        if any(field in data for field in password_fields):
            if "current_password" not in data:
                raise ValidationError("Current password is required")
            if data.get("new_password") != data.get("confirm_new_password"):
                raise ValidationError("New passwords do not match")


class UserProfileSchema(Schema):
    """Schema for user profile data serialization."""

    id = fields.Integer(dump_only=True)
    username: Any = fields.String(dump_only=True)
    first_name: Any = fields.String(dump_only=True)
    last_name: Any = fields.String(dump_only=True)
    games_played = fields.Integer(dump_only=True)
    games_won: Any = fields.Integer(dump_only=True)
    tournaments_played: Any = fields.Integer(dump_only=True)
    tournaments_won: Any = fields.Integer(dump_only=True)
    ranking: Any = fields.Integer(dump_only=True)
    rating: Any = fields.Float(dump_only=True)


class UserResource(BaseResource):
    """Resource for individual user operations."""

    schema = UserSchema()
    update_schema = UserUpdateSchema()

    @require_auth
    def get(self, user_id: int):
        """Get user details.

        Args:
            user_id: User ID

        Returns:
            User details
        """
        user: Any = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        if user_id != current_user.id and not current_user.has_role("admin"):
            raise AuthorizationError("Not authorized to view this user")

        return self.success_response(
            message="User retrieved successfully", data={"user": self.schema.dump(user)}
        )

    @require_auth
    def put(self, user_id: int):
        """Update user details.

        Args:
            user_id: User ID

        Returns:
            Updated user details
        """
        if user_id != current_user.id and not current_user.has_role("admin"):
            raise AuthorizationError("Not authorized to update this user")

        user: Any = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        data = self.get_json_data()

        # Handle password update
        if "new_password" in data:
            if not user.check_password(data["current_password"]):
                raise ValidationError("Current password is incorrect")
            user.set_password(data["new_password"])

        # Update other fields
        for field in ["first_name", "last_name"]:
            if field in data:
                setattr(user, field, data[field])

        user.save()

        return self.success_response(
            message="User updated successfully", data={"user": self.schema.dump(user)}
        )

    @require_roles(["admin"])
    def delete(self, user_id: int):
        """Delete user.

        Args:
            user_id: User ID

        Returns:
            Success message
        """
        user: Any = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        user.delete()
        return self.success_response(message="User deleted successfully")


class UserListResource(BaseResource):
    """Resource for user list operations."""

    schema = UserSchema()

    @require_roles(["admin"])
    def get(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get list of users.

        Returns:
            List of user details
        """
        page: Any = request.args.get("page", 1, type=int, type=str)
        per_page: Any = min(request.args.get("per_page", 20, type=int, type=str), 100)

        query: Any = User.query

        # Apply filters
        email: Any = request.args.get("email", type=str)
        if email:
            query: Any = query.filter(User.email.ilike(f"%{email}%"))

        username: Any = request.args.get("username", type=str)
        if username:
            query: Any = query.filter(User.username.ilike(f"%{username}%"))

        is_active: Any = request.args.get("is_active", type=bool, type=str)
        if is_active is not None:
            query: Any = query.filter_by(is_active=is_active)

        # Apply sorting
        sort_by: str = request.args.get("sort_by", "created_at", type=str)
        sort_dir: str = request.args.get("sort_dir", "desc", type=str)

        if hasattr(User, sort_by):
            order_by = getattr(User, sort_by)
            if sort_dir.lower() == "desc":
                order_by = order_by.desc()
            query = query.order_by(order_by)

        pagination: Any = query.paginate(page=page, per_page=per_page, error_out=False)

        return self.success_response(
            message="Users retrieved successfully",
            data={
                "users": self.schema.dump(pagination.items, many=True),
                "total": pagination.total,
                "pages": pagination.pages,
                "current_page": page,
                "per_page": per_page,
            },
        )


class UserProfileResource(BaseResource):
    """Resource for user profile operations."""

    schema = UserProfileSchema()

    def get(self, user_id: int):
        """Get user profile.

        Args:
            user_id: User ID

        Returns:
            User profile details
        """
        user: Any = User.query.get(user_id)
        if not user:
            raise NotFoundError("User not found")

        profile_data: Dict[Any, Any] = {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "games_played": len(user.games),
            "games_won": sum(1 for game in user.games if game.winner_id == user.id),
            "tournaments_played": len(user.tournaments),
            "tournaments_won": sum(
                1 for tournament in user.tournaments if tournament.winner_id == user.id
            ),
            "ranking": user.ranking,
            "rating": user.rating,
        }

        return self.success_response(
            message="User profile retrieved successfully",
            data={"profile": self.schema.dump(profile_data)},
        )
