from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ...models.user import User
from .jwt import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get the current authenticated user from the JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = await User.get(user_id)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current authenticated user and verify they are active
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current authenticated user and verify they are an admin
    """
    if not current_user.is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    return current_user


async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None
    """
    if not token:
        return None

    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id:
            return await User.get(user_id)
    except Exception:
        pass

    return None


def check_permissions(*required_permissions: str):
    """
    Decorator to check if user has required permissions
    """

    async def permission_checker(current_user: User = Depends(get_current_user)):
        user_permissions = set(current_user.permissions)
        if not all(perm in user_permissions for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
            )
        return current_user

    return permission_checker


def check_roles(*required_roles: str):
    """
    Decorator to check if user has required roles
    """

    async def role_checker(current_user: User = Depends(get_current_user)):
        user_roles = set(current_user.roles)
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Required role not found"
            )
        return current_user

    return role_checker
