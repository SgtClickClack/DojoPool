import heapq
import json
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


@dataclass
class CacheEntry:
    path: str
    size: int
    last_accessed: float
    hits: int = 0
    webp_path: Optional[str] = None
    variants: Optional[Dict[str, str]] = None
    created_at: float = time.time()
    last_validated: float = time.time()
    is_stale: bool = False


class ImageCache:
    def __init__(
        self,
        cache_dir: str,
        max_size_bytes: int = 500 * 1024 * 1024,
        max_entries: int = 1000,
        max_age_days: int = 30,
        cleanup_interval: int = 3600,  # 1 hour
        min_hit_count: int = 5,
    ):
        """Initialize the image cache with the given parameters.

        Args:
            cache_dir: Directory to store cached files
            max_size_bytes: Maximum cache size in bytes
            max_entries: Maximum number of entries in cache
            max_age_days: Maximum age of entries in days
            cleanup_interval: Interval between cleanup runs in seconds
            min_hit_count: Minimum hits required to keep entry during cleanup
        """
        self.cache_dir = Path(cache_dir)
        self.max_size_bytes = max_size_bytes
        self.max_entries = max_entries
        self.max_age = timedelta(days=max_age_days)
        self.cleanup_interval = cleanup_interval
        self.min_hit_count = min_hit_count
        self.current_size = 0
        self.entries: Dict[str, CacheEntry] = {}
        self.last_cleanup = time.time()
        self._load_manifest()

    def add(
        self,
        key: str,
        file_path: str,
        webp_path: Optional[str] = None,
        variants: Optional[Dict[str, str]] = None,
    ) -> bool:
        """Add a file to the cache with optional WebP version and variants."""
        self._run_cleanup_if_needed()

        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            logging.warning(f"File {file_path} does not exist")
            return False

        # Calculate total size including all variants
        file_size = self._calculate_total_size(file_path_obj, webp_path, variants)
        if file_size > self.max_size_bytes:
            logging.warning(f"Total size for {key} exceeds maximum cache size")
            return False

        # Check if we need to evict entries
        if (
            len(self.entries) >= self.max_entries
            or self.current_size + file_size > self.max_size_bytes
        ):
            if not self._evict_entries(file_size):
                logging.warning(f"Not enough space in cache for {key}")
                return False

        # Add the new entry
        entry = CacheEntry(
            path=str(file_path),
            size=file_size,
            last_accessed=time.time(),
            hits=0,
            webp_path=webp_path,
            variants=variants,
            created_at=time.time(),
            last_validated=time.time(),
            is_stale=False,
        )
        self.entries[key] = entry
        self.current_size += file_size
        self._save_manifest()
        return True

    def get(self, key: str) -> Optional[CacheEntry]:
        """Get an entry from the cache by key."""
        self._run_cleanup_if_needed()

        entry = self.entries.get(key)
        if entry:
            if self._is_entry_valid(entry):
                entry.hits += 1
                entry.last_accessed = time.time()
                entry.is_stale = False
                self._save_manifest()
                return entry
            else:
                self.remove(key)
                return None
        return None

    def _is_entry_valid(self, entry: CacheEntry) -> bool:
        """Check if a cache entry is still valid."""
        # Check if files still exist
        if not Path(entry.path).exists():
            return False
        if entry.webp_path and not Path(entry.webp_path).exists():
            return False
        if entry.variants:
            if any(not Path(path).exists() for path in entry.variants.values()):
                return False

        # Check age
        age = time.time() - entry.created_at
        if age > self.max_age.total_seconds():
            return False

        # Mark as stale if not accessed recently
        if time.time() - entry.last_accessed > self.cleanup_interval:
            entry.is_stale = True
            self._save_manifest()  # Persist the stale state

        return True

    def _calculate_total_size(
        self, file_path: Path, webp_path: Optional[str], variants: Optional[Dict[str, str]]
    ) -> int:
        """Calculate total size of an entry including all variants."""
        total_size = file_path.stat().st_size

        if webp_path:
            webp_path_obj = Path(webp_path)
            if webp_path_obj.exists():
                total_size += webp_path_obj.stat().st_size

        if variants:
            for variant_path in variants.values():
                variant_path_obj = Path(variant_path)
                if variant_path_obj.exists():
                    total_size += variant_path_obj.stat().st_size

        return total_size

    def _evict_entries(self, required_space: int) -> bool:
        """Evict entries from the cache using a sophisticated strategy."""
        if not self.entries:
            return True

        # Calculate scores for each entry
        entry_scores: List[Tuple[float, str]] = []
        for key, entry in self.entries.items():
            # Score based on multiple factors:
            # - Higher score = more likely to be evicted
            # - Age factor: older entries score higher
            age_factor = (time.time() - entry.created_at) / self.max_age.total_seconds()

            # Access factor: less frequently accessed entries score higher
            access_factor = 1.0 / (entry.hits + 1)

            # Size factor: larger entries score higher when space is needed
            size_factor = entry.size / self.max_size_bytes

            # Staleness factor: stale entries score higher
            stale_factor = 2.0 if entry.is_stale else 1.0

            # Combine factors with weights
            score = 0.3 * age_factor + 0.3 * access_factor + 0.2 * size_factor + 0.2 * stale_factor

            heapq.heappush(entry_scores, (-score, key))  # Negative score for max-heap

        # Evict entries until we have enough space
        while entry_scores and (
            len(self.entries) >= self.max_entries
            or self.current_size + required_space > self.max_size_bytes
        ):
            _, key = heapq.heappop(entry_scores)
            if self.remove(key):
                logging.info(f"Evicted entry {key} from cache")
            else:
                logging.warning(f"Failed to evict entry {key} from cache")

        return self.current_size + required_space <= self.max_size_bytes

    def _run_cleanup_if_needed(self) -> None:
        """Run cleanup if the cleanup interval has elapsed."""
        current_time = time.time()
        if current_time - self.last_cleanup >= self.cleanup_interval:
            self._cleanup()
            self.last_cleanup = current_time

    def _cleanup(self) -> None:
        """Perform cache cleanup and maintenance."""
        logging.info("Starting cache cleanup")
        keys_to_remove: Set[str] = set()

        # Identify entries to remove
        for key, entry in self.entries.items():
            # Remove invalid entries
            if not self._is_entry_valid(entry):
                keys_to_remove.add(key)
                continue

            # Only remove stale entries if they have low hit counts
            if entry.is_stale and entry.hits < self.min_hit_count:
                # Check if entry is old enough to be removed
                age = time.time() - entry.created_at
                if age > self.cleanup_interval * 2:  # Give entries more time before removal
                    keys_to_remove.add(key)
                continue

        # Remove identified entries
        for key in keys_to_remove:
            self.remove(key)

        # Compact the manifest file if needed
        self._compact_manifest()
        logging.info(f"Cache cleanup completed. Removed {len(keys_to_remove)} entries")

    def _compact_manifest(self) -> None:
        """Compact the manifest file by rewriting it."""
        if len(self.entries) > 0:
            self._save_manifest()

    def get_stats(self) -> Dict[str, Any]:
        """Get detailed cache statistics."""
        current_time = time.time()
        hit_counts = {key: entry.hits for key, entry in self.entries.items()}
        total_size_mb = self.current_size / (1024 * 1024)
        max_size_mb = self.max_size_bytes / (1024 * 1024)
        utilization = (
            (self.current_size / self.max_size_bytes) * 100 if self.max_size_bytes > 0 else 0
        )

        # Calculate additional stats
        stale_entries = sum(1 for entry in self.entries.values() if entry.is_stale)
        avg_age = (
            sum(current_time - entry.created_at for entry in self.entries.values())
            / len(self.entries)
            if self.entries
            else 0
        )
        avg_hits = (
            sum(entry.hits for entry in self.entries.values()) / len(self.entries)
            if self.entries
            else 0
        )

        return {
            "total_entries": len(self.entries),
            "current_size_mb": round(total_size_mb, 2),
            "max_size_mb": round(max_size_mb, 2),
            "utilization": round(utilization, 2),
            "hit_counts": hit_counts,
            "stale_entries": stale_entries,
            "avg_age_days": round(avg_age / (24 * 3600), 2),
            "avg_hits": round(avg_hits, 2),
            "last_cleanup": datetime.fromtimestamp(self.last_cleanup).isoformat(),
        }

    def _load_manifest(self) -> None:
        """Load the cache manifest from disk."""
        manifest_path = self.cache_dir / "manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r") as f:
                    data = json.load(f)
                    self.entries = {k: CacheEntry(**v) for k, v in data["entries"].items()}
                    self.current_size = sum(entry.size for entry in self.entries.values())
            except Exception as e:
                logging.error(f"Error loading manifest: {str(e)}")
                self.entries = {}
                self.current_size = 0

    def _save_manifest(self) -> None:
        """Save the cache manifest to disk."""
        manifest_path = self.cache_dir / "manifest.json"
        try:
            manifest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(manifest_path, "w") as f:
                json.dump({"entries": {k: asdict(v) for k, v in self.entries.items()}}, f)
        except Exception as e:
            logging.error(f"Error saving manifest: {str(e)}")

    def remove(self, key: str) -> bool:
        """Remove an entry from the cache."""
        try:
            entry = self.entries.pop(key)
            self.current_size -= entry.size

            # Clean up files if they're in the cache directory
            if str(self.cache_dir) in entry.path:
                try:
                    Path(entry.path).unlink(missing_ok=True)
                except Exception as e:
                    logging.warning(f"Failed to delete file {entry.path}: {str(e)}")

            if entry.webp_path and str(self.cache_dir) in entry.webp_path:
                try:
                    Path(entry.webp_path).unlink(missing_ok=True)
                except Exception as e:
                    logging.warning(f"Failed to delete WebP file {entry.webp_path}: {str(e)}")

            if entry.variants:
                for variant_path in entry.variants.values():
                    if str(self.cache_dir) in variant_path:
                        try:
                            Path(variant_path).unlink(missing_ok=True)
                        except Exception as e:
                            logging.warning(
                                f"Failed to delete variant file {variant_path}: {str(e)}"
                            )

            self._save_manifest()
            return True
        except KeyError:
            logging.warning(f"Failed to remove entry {key} from cache: Entry not found")
            return False
        except Exception as e:
            logging.error(f"Error removing entry {key} from cache: {str(e)}")
            return False

    def clear(self) -> None:
        """Clear all entries from the cache."""
        # Remove all files in the cache directory
        try:
            for file_path in self.cache_dir.glob("**/*"):
                if file_path.is_file() and file_path.name != "manifest.json":
                    try:
                        file_path.unlink()
                    except Exception as e:
                        logging.warning(f"Failed to delete file {file_path}: {str(e)}")
        except Exception as e:
            logging.error(f"Error cleaning cache directory: {str(e)}")

        self.entries.clear()
        self.current_size = 0
        self._save_manifest()
