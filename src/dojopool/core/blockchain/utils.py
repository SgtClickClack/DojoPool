"""
Utility functions for blockchain operations.
"""
from functools import wraps
import asyncio
from typing import TypeVar, Callable, Any
from dojopool.core.exceptions import BlockchainError

T = TypeVar('T')

def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exceptions: tuple = (Exception,)
) -> Callable:
    """
    Decorator that implements exponential backoff retry logic for blockchain operations.
    
    Args:
        max_attempts: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exceptions: Tuple of exceptions to catch and retry
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_attempts - 1:
                        raise BlockchainError(
                            f"Operation failed after {max_attempts} attempts: {str(e)}"
                        ) from e
                        
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    await asyncio.sleep(delay)
                    
            raise BlockchainError(
                f"Operation failed after {max_attempts} attempts: {str(last_exception)}"
            )
            
        return wrapper
    return decorator

def validate_address(address: str, chain: str) -> bool:
    """
    Validate blockchain address format.
    
    Args:
        address: Address to validate
        chain: Chain type ('ethereum' or 'solana')
        
    Returns:
        bool: True if address is valid
    """
    if chain.lower() == 'ethereum':
        from web3 import Web3
        return Web3.is_address(address)
    elif chain.lower() == 'solana':
        # Solana addresses are 32-byte base58 encoded strings
        import base58
        try:
            decoded = base58.b58decode(address)
            return len(decoded) == 32
        except Exception:
            return False
    else:
        raise ValueError(f"Unsupported chain: {chain}") 