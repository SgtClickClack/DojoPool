"""User resources module.

This module provides API resources for user operations.
"""
from flask import current_app, request
from flask_login import current_user
from marshmallow import Schema, fields, validate, validates_schema

from src.core.security import require_auth, require_roles
from src.core.exceptions import NotFoundError, AuthorizationError, ValidationError
from src.core.auth.models import User
from .base import BaseResource

class UserSchema(Schema):
    """Schema for user data serialization."""
    
    id = fields.Integer(dump_only=True)
    email = fields.Email(dump_only=True)
    username = fields.String(dump_only=True)
    first_name = fields.String()
    last_name = fields.String()
    is_active = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserUpdateSchema(Schema):
    """Schema for user update data validation."""
    
    first_name = fields.String(required=False)
    last_name = fields.String(required=False)
    current_password = fields.String(required=False)
    new_password = fields.String(required=False)
    confirm_new_password = fields.String(required=False)
    
    @validates_schema
    def validate_password_update(self, data, **kwargs):
        """Validate password update fields."""
        if any(field in data for field in ['new_password', 'confirm_new_password']):
            if 'current_password' not in data:
                raise ValidationError('Current password is required')
            if 'new_password' not in data or 'confirm_new_password' not in data:
                raise ValidationError('New password and confirmation are required')
            if data['new_password'] != data['confirm_new_password']:
                raise ValidationError('New passwords do not match')
            if len(data['new_password']) < 8:  # Using reasonable defaults
                raise ValidationError('Password is too short')
            if len(data['new_password']) > 128:  # Using reasonable defaults
                raise ValidationError('Password is too long')

class UserProfileSchema(Schema):
    """Schema for user profile data serialization."""
    
    id = fields.Integer(dump_only=True)
    username = fields.String(dump_only=True)
    first_name = fields.String(dump_only=True)
    last_name = fields.String(dump_only=True)
    games_played = fields.Integer(dump_only=True)
    games_won = fields.Integer(dump_only=True)
    tournaments_played = fields.Integer(dump_only=True)
    tournaments_won = fields.Integer(dump_only=True)
    ranking = fields.Integer(dump_only=True)
    rating = fields.Float(dump_only=True)

class UserResource(BaseResource):
    """Resource for individual user operations."""
    
    schema = UserSchema()
    update_schema = UserUpdateSchema()
    
    @require_auth
    def get(self, user_id):
        """Get user details.
        
        Args:
            user_id: ID of the user to retrieve.
            
        Returns:
            User details.
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError('User not found')
        
        if user.id != current_user.id and not current_user.has_role('admin'):
            raise AuthorizationError()
        
        return self.success_response(data=self.schema.dump(user))
    
    @require_auth
    def put(self, user_id):
        """Update user details.
        
        Args:
            user_id: ID of the user to update.
            
        Returns:
            Updated user details.
        """
        if user_id != current_user.id and not current_user.has_role('admin'):
            raise AuthorizationError()
        
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError('User not found')
        
        data = self.update_schema.load(self.get_json_data())
        
        # Handle password update
        if 'new_password' in data:
            if not user.check_password(data['current_password']):
                raise ValidationError('Current password is incorrect')
            user.set_password(data['new_password'])
        
        # Update other fields
        for field in ['first_name', 'last_name']:
            if field in data:
                setattr(user, field, data[field])
        
        user.save()
        
        return self.success_response(
            data=self.schema.dump(user),
            message='User updated successfully'
        )
    
    @require_roles('admin')
    def delete(self, user_id):
        """Delete user.
        
        Args:
            user_id: ID of the user to delete.
            
        Returns:
            Success message.
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError('User not found')
        
        user.delete()
        
        return self.success_response(message='User deleted successfully')

class UserListResource(BaseResource):
    """Resource for user list operations."""
    
    schema = UserSchema()
    
    @require_roles('admin')
    def get(self):
        """Get list of users."""
        query = User.query
        
        # Apply filters
        username = request.args.get('username')
        if username:
            query = query.filter(User.username.ilike(f'%{username}%'))
        
        email = request.args.get('email')
        if email:
            query = query.filter(User.email.ilike(f'%{email}%'))
        
        is_active = request.args.get('is_active')
        if is_active is not None:
            query = query.filter_by(is_active=is_active.lower() == 'true')
        
        # Apply sorting
        sort_by = request.args.get('sort_by', 'id')
        sort_dir = request.args.get('sort_dir', 'asc')
        
        if hasattr(User, sort_by):
            order_by = getattr(User, sort_by)
            if sort_dir.lower() == 'desc':
                order_by = order_by.desc()
            query = query.order_by(order_by)
        
        return self.paginate(query)

class UserProfileResource(BaseResource):
    """Resource for user profile operations."""
    
    schema = UserProfileSchema()
    
    def get(self, user_id):
        """Get user profile.
        
        Args:
            user_id: ID of the user to retrieve profile for.
            
        Returns:
            User profile data.
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError('User not found')
        
        return self.success_response(data=self.schema.dump(user)) 