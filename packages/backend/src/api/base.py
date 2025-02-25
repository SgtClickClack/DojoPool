from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class BaseAPIView(APIView):
    """
    Base API view with common functionality.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        """
        Override to provide custom permission classes based on the action.
        """
        return [permission() for permission in self.permission_classes]

class PublicAPIView(BaseAPIView):
    """
    Base API view for public endpoints.
    """
    permission_classes = [AllowAny] 