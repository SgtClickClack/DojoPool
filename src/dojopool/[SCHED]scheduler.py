"""Task scheduler module."""
from datetime import datetime
import threading
import time
import schedule

from src.tasks.tournament_tasks import process_tournament_tasks

def run_scheduler():
    """Run the task scheduler."""
    # Schedule tournament tasks to run every 5 minutes
    schedule.every(5).minutes.do(process_tournament_tasks)
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Sleep for 1 minute between checks

def start_scheduler():
    """Start the scheduler in a background thread."""
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True  # Thread will exit when main thread exits
    scheduler_thread.start()
    print(f"Scheduler started at {datetime.now()}")

def stop_scheduler():
    """Stop all scheduled jobs."""
    schedule.clear()
    print(f"Scheduler stopped at {datetime.now()}")
