"""
Authentication Views for DojoPool
"""

from django.contrib.auth import get_user_model
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .jwt import generate_token, refresh_token
from .serializers import UserRegistrationSerializer, UserLoginSerializer

User = get_user_model()

class RegisterView(views.APIView):
    """
    User registration endpoint
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Register a new user
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = generate_token(user)
            return Response({
                'message': 'User registered successfully',
                'user': serializer.data,
                **tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    """
    User login endpoint
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Authenticate user and return tokens
        """
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = generate_token(user)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'nickname': user.nickname
                },
                **tokens
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(views.APIView):
    """
    Token refresh endpoint
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Refresh access token using refresh token
        """
        refresh = request.data.get('refresh_token')
        if not refresh:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            tokens = refresh_token(refresh)
            return Response(tokens)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    """
    User logout endpoint
    """
    def post(self, request):
        """
        Invalidate user tokens
        """
        # In a stateless JWT system, we don't need to do anything server-side
        # The client should remove the tokens
        return Response({
            'message': 'Logged out successfully'
        }) 