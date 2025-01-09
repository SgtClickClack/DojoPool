"""Authentication forms module.

This module contains forms for user authentication and registration.
"""
from flask_wtf import FlaskForm
from wtforms import (
    StringField, PasswordField, BooleanField, SubmitField,
    ValidationError
)
from wtforms.validators import (
    DataRequired, Email, EqualTo, Length, Regexp
)

from dojopool.models.user import User

class LoginForm(FlaskForm):
    """Form for user login."""
    
    username = StringField(
        'Username or Email',
        validators=[DataRequired(), Length(1, 120)]
    )
    password = PasswordField(
        'Password',
        validators=[DataRequired()]
    )
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Log In')

class RegistrationForm(FlaskForm):
    """Form for user registration."""
    
    username = StringField(
        'Username',
        validators=[
            DataRequired(),
            Length(3, 64),
            Regexp(
                '^[A-Za-z][A-Za-z0-9_.]*$',
                0,
                'Usernames must start with a letter and can only contain '
                'letters, numbers, dots, and underscores'
            )
        ]
    )
    email = StringField(
        'Email',
        validators=[
            DataRequired(),
            Email(),
            Length(1, 120)
        ]
    )
    password = PasswordField(
        'Password',
        validators=[
            DataRequired(),
            Length(8, 128),
            Regexp(
                r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$',
                0,
                'Password must contain at least one letter, one number, '
                'and one special character'
            )
        ]
    )
    confirm_password = PasswordField(
        'Confirm Password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match')
        ]
    )
    submit = SubmitField('Register')
    
    def validate_username(self, field):
        """Validate username is unique.
        
        Args:
            field: Form field to validate.
            
        Raises:
            ValidationError: If username is already taken.
        """
        if User.get_by_username(field.data):
            raise ValidationError('Username already taken')
    
    def validate_email(self, field):
        """Validate email is unique.
        
        Args:
            field: Form field to validate.
            
        Raises:
            ValidationError: If email is already registered.
        """
        if User.get_by_email(field.data):
            raise ValidationError('Email already registered')

class PasswordResetRequestForm(FlaskForm):
    """Form for requesting password reset."""
    
    email = StringField(
        'Email',
        validators=[
            DataRequired(),
            Email(),
            Length(1, 120)
        ]
    )
    submit = SubmitField('Reset Password')

class PasswordResetForm(FlaskForm):
    """Form for resetting password."""
    
    password = PasswordField(
        'New Password',
        validators=[
            DataRequired(),
            Length(8, 128),
            Regexp(
                r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$',
                0,
                'Password must contain at least one letter, one number, '
                'and one special character'
            )
        ]
    )
    confirm_password = PasswordField(
        'Confirm Password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match')
        ]
    )
    submit = SubmitField('Reset Password')

class ChangePasswordForm(FlaskForm):
    """Form for changing password."""
    
    old_password = PasswordField(
        'Current Password',
        validators=[DataRequired()]
    )
    password = PasswordField(
        'New Password',
        validators=[
            DataRequired(),
            Length(8, 128),
            Regexp(
                r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$',
                0,
                'Password must contain at least one letter, one number, '
                'and one special character'
            )
        ]
    )
    confirm_password = PasswordField(
        'Confirm New Password',
        validators=[
            DataRequired(),
            EqualTo('password', message='Passwords must match')
        ]
    )
    submit = SubmitField('Change Password')

class EmailChangeForm(FlaskForm):
    """Form for changing email address."""
    
    email = StringField(
        'New Email',
        validators=[
            DataRequired(),
            Email(),
            Length(1, 120)
        ]
    )
    password = PasswordField(
        'Password',
        validators=[DataRequired()]
    )
    submit = SubmitField('Change Email')
    
    def validate_email(self, field):
        """Validate new email is unique.
        
        Args:
            field: Form field to validate.
            
        Raises:
            ValidationError: If email is already registered.
        """
        if User.get_by_email(field.data):
            raise ValidationError('Email already registered') 