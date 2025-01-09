import pytest
from datetime import datetime, timedelta
from dojopool.services.task_service import TaskService
from dojopool.models.task import Task, TaskStatus
from dojopool.exceptions import TaskError

@pytest.fixture
def task_service():
    return TaskService()

@pytest.fixture
def sample_task():
    return Task(
        name="process_tournament_results",
        status=TaskStatus.PENDING,
        priority="high",
        scheduled_for=datetime.utcnow()
    )

class TestBackgroundTasks:
    def test_task_creation(self, task_service, sample_task):
        """Test task creation and validation"""
        assert sample_task.status == TaskStatus.PENDING
        assert sample_task.priority == "high"
        
        # Test invalid task
        with pytest.raises(TaskError):
            Task(
                name="invalid_task",
                status="invalid_status",
                priority="unknown"
            )

    def test_task_scheduling(self, task_service):
        """Test task scheduling functionality"""
        # Schedule immediate task
        immediate_task = task_service.schedule_task(
            name="send_game_notification",
            payload={"user_id": 1, "message": "Game starting"}
        )
        assert immediate_task.scheduled_for <= datetime.utcnow()
        
        # Schedule future task
        future_time = datetime.utcnow() + timedelta(hours=1)
        future_task = task_service.schedule_task(
            name="send_tournament_reminder",
            payload={"tournament_id": 1},
            scheduled_for=future_time
        )
        assert future_task.scheduled_for == future_time

    def test_task_execution(self, task_service, sample_task):
        """Test task execution process"""
        # Start task execution
        running_task = task_service.start_task(sample_task)
        assert running_task.status == TaskStatus.RUNNING
        assert running_task.started_at is not None
        
        # Complete task
        completed_task = task_service.complete_task(
            running_task,
            result={"status": "success", "processed_items": 10}
        )
        assert completed_task.status == TaskStatus.COMPLETED
        assert completed_task.completed_at is not None
        assert completed_task.result is not None

    def test_task_failure_handling(self, task_service, sample_task):
        """Test handling of task failures"""
        # Simulate task failure
        failed_task = task_service.fail_task(
            sample_task,
            error="Database connection error",
            retry_count=1
        )
        
        assert failed_task.status == TaskStatus.FAILED
        assert failed_task.error is not None
        assert failed_task.retry_count == 1
        
        # Test retry mechanism
        retried_task = task_service.retry_task(failed_task)
        assert retried_task.status == TaskStatus.PENDING
        assert retried_task.retry_count == 2

    def test_task_prioritization(self, task_service):
        """Test task priority handling"""
        tasks = [
            task_service.schedule_task(
                name=f"task_{i}",
                priority="low" if i % 2 == 0 else "high"
            )
            for i in range(5)
        ]
        
        # Get next task to process
        next_task = task_service.get_next_task()
        assert next_task.priority == "high"
        
        # Get all tasks by priority
        high_priority_tasks = task_service.get_tasks_by_priority("high")
        assert all(task.priority == "high" for task in high_priority_tasks)

    def test_task_dependencies(self, task_service):
        """Test task dependency management"""
        # Create dependent tasks
        parent_task = task_service.schedule_task(
            name="process_tournament",
            payload={"tournament_id": 1}
        )
        
        child_task = task_service.schedule_task(
            name="send_results",
            payload={"tournament_id": 1},
            depends_on=parent_task.id
        )
        
        assert child_task.depends_on == parent_task.id
        assert not task_service.can_start_task(child_task)
        
        # Complete parent task
        task_service.complete_task(parent_task)
        assert task_service.can_start_task(child_task)

    def test_task_cancellation(self, task_service, sample_task):
        """Test task cancellation"""
        # Cancel pending task
        cancelled_task = task_service.cancel_task(sample_task)
        assert cancelled_task.status == TaskStatus.CANCELLED
        
        # Try to start cancelled task
        with pytest.raises(TaskError):
            task_service.start_task(cancelled_task)

    def test_task_monitoring(self, task_service):
        """Test task monitoring and statistics"""
        # Create multiple tasks
        for i in range(5):
            task = task_service.schedule_task(
                name=f"task_{i}",
                priority="normal"
            )
            if i % 2 == 0:
                task_service.complete_task(task)
            else:
                task_service.fail_task(task, error="Test error")
        
        # Get task statistics
        stats = task_service.get_task_statistics()
        assert stats["total_tasks"] == 5
        assert stats["completed_tasks"] == 3
        assert stats["failed_tasks"] == 2
        assert "average_execution_time" in stats

    def test_periodic_tasks(self, task_service):
        """Test periodic task scheduling"""
        # Schedule periodic task
        periodic_task = task_service.schedule_periodic_task(
            name="cleanup_old_games",
            interval_minutes=60,
            payload={"older_than_days": 30}
        )
        
        assert periodic_task.is_periodic is True
        assert periodic_task.interval_minutes == 60
        
        # Get next run time
        next_run = task_service.get_next_run_time(periodic_task)
        assert next_run > datetime.utcnow() 