"""
Service worker implementation for offline support and background synchronization.
Handles caching strategies and offline image processing queue.
"""

from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging
import json
import os
from pathlib import Path
import asyncio
import aiohttp
from .cache_manager import CacheManager, CacheConfig

logger = logging.getLogger(__name__)

@dataclass
class SyncTask:
    """Represents a task for background synchronization."""
    id: str
    type: str  # 'upload', 'process', 'delete'
    data: Dict[str, Any]
    created_at: datetime
    retries: int = 0
    max_retries: int = 3

class ServiceWorker:
    """Manages offline support and background synchronization."""
    
    def __init__(
        self,
        cache_config: Optional[CacheConfig] = None,
        sync_interval: int = 300  # 5 minutes
    ):
        """Initialize service worker with configuration."""
        self.cache = CacheManager(cache_config)
        self.sync_interval = sync_interval
        
        # Create sync directory if it doesn't exist
        self._sync_dir = Path('sync')
        self._sync_dir.mkdir(exist_ok=True)
        
        # Initialize sync queue
        self._sync_queue: List[SyncTask] = []
        self._load_sync_queue()
        
        # Start background sync
        asyncio.create_task(self._run_background_sync())
    
    async def fetch(
        self,
        url: str,
        strategy: str = 'cache-first'
    ) -> Tuple[Optional[bytes], Optional[str]]:
        """
        Fetch a resource using the specified caching strategy.
        
        Strategies:
        - cache-first: Check cache before network
        - network-first: Try network, fall back to cache
        - cache-only: Only check cache
        - network-only: Only try network
        """
        try:
            if strategy == 'cache-only':
                return self._fetch_from_cache(url)
            
            if strategy == 'cache-first':
                cached = self._fetch_from_cache(url)
                if cached[0]:
                    return cached
            
            if strategy in ('network-first', 'network-only', 'cache-first'):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(url) as response:
                            if response.status == 200:
                                data = await response.read()
                                mime_type = response.headers.get('content-type')
                                
                                # Cache the response
                                if strategy != 'network-only':
                                    self.cache.put(url, data, mime_type)
                                
                                return data, mime_type
                except Exception as e:
                    logger.error(f"Network fetch failed: {str(e)}")
                    if strategy == 'network-first':
                        return self._fetch_from_cache(url)
            
            return None, None
            
        except Exception as e:
            logger.error(f"Error fetching resource: {str(e)}")
            return None, None
    
    def queue_sync_task(
        self,
        task_type: str,
        data: Dict[str, Any]
    ) -> str:
        """Add a task to the synchronization queue."""
        try:
            task = SyncTask(
                id=f"{task_type}_{datetime.now().timestamp()}",
                type=task_type,
                data=data,
                created_at=datetime.now()
            )
            
            # Save task to disk
            task_path = self._sync_dir / f"{task.id}.json"
            with open(task_path, 'w') as f:
                json.dump({
                    'id': task.id,
                    'type': task.type,
                    'data': task.data,
                    'created_at': task.created_at.isoformat(),
                    'retries': task.retries,
                    'max_retries': task.max_retries
                }, f)
            
            # Add to queue
            self._sync_queue.append(task)
            
            return task.id
            
        except Exception as e:
            logger.error(f"Error queuing sync task: {str(e)}")
            return ""
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get the current synchronization status."""
        try:
            pending = len(self._sync_queue)
            failed = len([t for t in self._sync_queue if t.retries >= t.max_retries])
            
            return {
                'pending_tasks': pending,
                'failed_tasks': failed,
                'next_sync': self._next_sync_time.isoformat() if hasattr(self, '_next_sync_time') else None
            }
            
        except Exception as e:
            logger.error(f"Error getting sync status: {str(e)}")
            return {
                'error': str(e)
            }
    
    def clear_failed_tasks(self) -> int:
        """Clear failed tasks from the queue."""
        try:
            failed_tasks = [
                t for t in self._sync_queue
                if t.retries >= t.max_retries
            ]
            
            for task in failed_tasks:
                task_path = self._sync_dir / f"{task.id}.json"
                if task_path.exists():
                    os.remove(task_path)
                self._sync_queue.remove(task)
            
            return len(failed_tasks)
            
        except Exception as e:
            logger.error(f"Error clearing failed tasks: {str(e)}")
            return 0
    
    async def _run_background_sync(self) -> None:
        """Run background synchronization periodically."""
        while True:
            try:
                self._next_sync_time = datetime.now()
                
                # Process sync queue
                for task in self._sync_queue[:]:  # Copy list to allow modification
                    if task.retries >= task.max_retries:
                        continue
                    
                    success = await self._process_sync_task(task)
                    
                    if success:
                        # Remove task file and from queue
                        task_path = self._sync_dir / f"{task.id}.json"
                        if task_path.exists():
                            os.remove(task_path)
                        self._sync_queue.remove(task)
                    else:
                        # Update retry count
                        task.retries += 1
                        task_path = self._sync_dir / f"{task.id}.json"
                        with open(task_path, 'w') as f:
                            json.dump({
                                'id': task.id,
                                'type': task.type,
                                'data': task.data,
                                'created_at': task.created_at.isoformat(),
                                'retries': task.retries,
                                'max_retries': task.max_retries
                            }, f)
                
            except Exception as e:
                logger.error(f"Error in background sync: {str(e)}")
            
            # Wait for next sync interval
            await asyncio.sleep(self.sync_interval)
    
    async def _process_sync_task(self, task: SyncTask) -> bool:
        """Process a single synchronization task."""
        try:
            if task.type == 'upload':
                return await self._process_upload_task(task)
            elif task.type == 'process':
                return await self._process_processing_task(task)
            elif task.type == 'delete':
                return await self._process_delete_task(task)
            else:
                logger.error(f"Unknown task type: {task.type}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing sync task: {str(e)}")
            return False
    
    async def _process_upload_task(self, task: SyncTask) -> bool:
        """Process an upload task."""
        try:
            url = task.data.get('url')
            data = task.data.get('data')
            headers = task.data.get('headers', {})
            
            if not url or not data:
                return False
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data, headers=headers) as response:
                    return response.status in (200, 201)
                    
        except Exception as e:
            logger.error(f"Error processing upload task: {str(e)}")
            return False
    
    async def _process_processing_task(self, task: SyncTask) -> bool:
        """Process an image processing task."""
        try:
            input_path = task.data.get('input_path')
            output_path = task.data.get('output_path')
            config = task.data.get('config', {})
            
            if not input_path or not output_path:
                return False
            
            # Process image
            # This would integrate with the image compression service
            return True
            
        except Exception as e:
            logger.error(f"Error processing image task: {str(e)}")
            return False
    
    async def _process_delete_task(self, task: SyncTask) -> bool:
        """Process a delete task."""
        try:
            url = task.data.get('url')
            headers = task.data.get('headers', {})
            
            if not url:
                return False
            
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, headers=headers) as response:
                    return response.status in (200, 204)
                    
        except Exception as e:
            logger.error(f"Error processing delete task: {str(e)}")
            return False
    
    def _fetch_from_cache(self, key: str) -> Tuple[Optional[bytes], Optional[str]]:
        """Fetch an item from cache."""
        entry = self.cache.get(key)
        if entry:
            return entry.data, entry.mime_type
        return None, None
    
    def _load_sync_queue(self) -> None:
        """Load existing sync tasks from disk."""
        try:
            for task_path in self._sync_dir.glob('*.json'):
                try:
                    with open(task_path, 'r') as f:
                        data = json.load(f)
                    
                    task = SyncTask(
                        id=data['id'],
                        type=data['type'],
                        data=data['data'],
                        created_at=datetime.fromisoformat(data['created_at']),
                        retries=data['retries'],
                        max_retries=data['max_retries']
                    )
                    
                    self._sync_queue.append(task)
                    
                except Exception as e:
                    logger.error(f"Error loading sync task: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error loading sync queue: {str(e)}")
``` 