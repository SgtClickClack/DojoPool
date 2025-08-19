"""User resources module.

This module provides API resources for user operations.
"""
from flask import current_app, request
from flask_login import current_user
from marshmallow import Schema, fields, validate, validates_schema

from dojopool.core.security import require_auth, require_roles
from dojopool.core.exceptions import NotFoundError, AuthorizationError, ValidationError
from dojopool.models.user import User
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
        if any(field in data for field in ['password', 'secret_key', 'new_os.getenv("PASSWORD_23")']):
            if 'current_password' not in data:
                raise ValidationError('Current password is required')
            if 'new_os.getenv("PASSWORD_23")' not in data:
                raise ValidationError('New password and confirmation are required')
            if data['new_os.getenv("PASSWORD_23")']:
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
        assert user is not None
        
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
        assert user is not None
        
        json_payload = self.get_json_data()
        if json_payload is None: # Ensure payload exists
             raise ValidationError('Request body cannot be empty.')
        data = self.update_schema.load(json_payload)
        
        # Add check to ensure data is a dictionary after loading
        if not isinstance(data, dict):
            # This case might indicate a schema loading issue rather than bad input
            current_app.logger.error(f"Schema loading resulted in non-dict type: {type(data)}")
            raise ValidationError('Invalid data format after processing.')

        # Handle password update
        if 'new_password' in data:
            # Check if the provided current password is correct
            # Use .get() for safer access in case 'current_password' is missing despite schema
            if not user.check_password(data.get('current_password', '')):
                raise ValidationError('Current password is incorrect')
            # Set the new password
            user.set_password(data['new_password'])
        
        # Update other fields
        for field in ['first_name', 'last_name']:
            if field in data:
                setattr(user, field, data[field])
        
        user.save()
        
        # Add assertion here too before dumping
        assert user is not None
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
            # Reverted cast
            query = query.filter(User.username.ilike(f'%{username}%'))
        
        email = request.args.get('email')
        if email:
            # Reverted cast
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
    
    @require_auth
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
        assert user is not None
        
        return self.success_response(data=self.schema.dump(user)) 