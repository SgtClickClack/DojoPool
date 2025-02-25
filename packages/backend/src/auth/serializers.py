"""
Authentication Serializers for DojoPool
"""

from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'nickname', 'password', 'confirm_password']
        
    def validate(self, data):
        """
        Validate password confirmation
        """
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        return data
        
    def create(self, validated_data):
        """
        Create and return a new user
        """
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            nickname=validated_data['nickname'],
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        """
        Validate user credentials
        """
        user = authenticate(
            email=data['email'],
            password=data['password']
        )
        
        if not user:
            raise serializers.ValidationError('Invalid email or password')
            
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
            
        data['user'] = user
        return data 