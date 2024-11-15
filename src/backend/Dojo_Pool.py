#!/usr/bin/env python3
import subprocess
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import json
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handler
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def verify_git_settings():
    """Apply and verify Git configuration settings."""
    try:
        # Check Git installation
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
            logger.info(f"Git is installed: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Git is not installed or not found in PATH")
            return False

        # Define required Git configurations
        configs = [
            ['git', 'config', '--global', 'user.email', 'replit@users.noreply.github.com'],
            ['git', 'config', '--global', 'user.name', 'Replit User'],
            ['git', 'config', '--global', 'init.defaultBranch', 'main'],
            ['git', 'config', '--global', 'credential.helper', 'store'],
            ['git', 'config', '--global', 'core.fileMode', 'false'],
            ['git', 'config', '--global', 'core.autocrlf', 'input'],
            ['git', 'config', '--global', 'pull.rebase', 'false']
        ]
        
        # Apply configurations
        logger.info("Applying Git configurations...")
        for config in configs:
            try:
                subprocess.run(config, capture_output=True, text=True, check=True)
                logger.info(f"Applied configuration: {' '.join(config[2:])}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to apply configuration {' '.join(config)}: {e.stderr}")
                return False

        # Verify configurations
        logger.info("Verifying Git configurations...")
        config_mapping = {
            'user.email': 'replit@users.noreply.github.com',
            'user.name': 'Replit User',
            'init.defaultBranch': 'main',
            'credential.helper': 'store',
            'core.fileMode': 'false',
            'core.autocrlf': 'input',
            'pull.rebase': 'false'
        }
        
        for key, expected in config_mapping.items():
            result = subprocess.run(
                ['git', 'config', '--get', key],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                logger.error(f"Git configuration {key} is not set")
                return False
                
            actual = result.stdout.strip()
            if actual != expected:
                logger.error(f"Git configuration {key} has unexpected value: {actual} (expected: {expected})")
                return False
                
            logger.info(f"Verified {key}: {actual}")

        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            subprocess.run(['git', 'init'], check=True)

        # Check for staged changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                            capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("There are staged changes in the repository")
            logger.info(f"Staged changes: {result.stdout.strip()}")  # Log staged changes
        else:
            logger.info("No staged changes in the repository")

        # Ensure the repository is up to date
        git_pull()  # Call git_pull to update the repository

        logger.info("All Git configurations verified successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration verification: {str(e)}")
        return False

class Avatar:
    def __init__(self, name):
        self.name = name
        self.experience = 0
        self.moral_alignment = 0  # Ranges from -100 (Evil) to 100 (Heroic)
        self.relationships = {}    # Key: Avatar name, Value: Relationship type
        self.available_missions = []  # Track available missions based on alignment

    def get_moral_alignment_category(self):
        """Returns the moral alignment category based on moral_alignment score."""
        if self.moral_alignment >= 70:
            return 'Heroic'
        elif self.moral_alignment >= 30:
            return 'Good'
        elif self.moral_alignment >= -30:
            return 'Neutral'
        elif self.moral_alignment >= -70:
            return 'Bad'
        else:
            return 'Evil'

    def make_decision(self, decision):
        """
        Enhanced decision making with moral alignment impact and mission updates.
        """
        moral_values = {
            'Very Good': 15,
            'Good': 10,
            'Neutral': 0,
            'Bad': -10,
            'Very Bad': -15
        }
        self.moral_alignment += moral_values.get(decision['type'], 0)
        self.experience += decision.get('value', 0)
        # Clamp moral_alignment between -100 and 100
        self.moral_alignment = max(min(self.moral_alignment, 100), -100)

        # Update available missions based on new alignment
        alignment_category = self.get_moral_alignment_category()
        self.update_available_missions(alignment_category)
        
        # Log the moral impact
        logger.info(f"{self.name}'s decision led to alignment change. New category: {alignment_category}")

    def update_relationship(self, other_avatar, interaction):
        """
        Update relationship status with another avatar based on interaction.
        """
        # interaction could be 'Friendly', 'Hostile', 'Neutral'
        self.relationships[other_avatar.name] = interaction

    def initiate_interaction(self, other_avatar):
        """
        Initiate an interaction with another avatar.
        """
        # Example interaction logic
        if self.moral_alignment > 0:
            interaction = 'Friendly'
            decision = {'type': 'Good', 'value': 5}
        else:
            interaction = 'Hostile'
            decision = {'type': 'Bad', 'value': -5}

        self.update_relationship(other_avatar, interaction)
        self.make_decision(decision)
        self.trigger_event(interaction)

    def trigger_event(self, interaction):
        """
        Trigger an event based on the interaction type.
        """
        if interaction == 'Friendly':
            print(f"{self.name} has made a new friend!")
        elif interaction == 'Hostile':
            print(f"{self.name} has made an enemy!")
        else:
            print(f"{self.name} remains neutral.")

    def learn_from_experience(self):
        """
        Adjust behavior based on accumulated experiences.
        This could be expanded with more complex learning algorithms.
        """
        if self.experience > 50:
            print(f"{self.name} has gained wisdom from their experiences.")
        elif self.experience < -50:
            print(f"{self.name} has learned from their mistakes.")

    def update_available_missions(self, alignment_category):
        """Update available missions based on moral alignment category."""
        mission_pools = {
            'Heroic': ['Save the Village', 'Protect the Innocent', 'Lead the Resistance'],
            'Good': ['Help the Needy', 'Solve Disputes', 'Guard the Peace'],
            'Neutral': ['Treasure Hunt', 'Explore Ruins', 'Gather Resources'],
            'Bad': ['Steal Artifacts', 'Intimidate Locals', 'Sabotage Plans'],
            'Evil': ['Corrupt the Pure', 'Spread Chaos', 'Dominate Others']
        }
        self.available_missions = mission_pools.get(alignment_category, [])

class EventType(Enum):
    BATTLE = "battle"
    TRAINING = "training"
    RELATIONSHIP = "relationship"
    ACHIEVEMENT = "achievement"
    MORAL_CHOICE = "moral_choice"
    CLAN = "clan"

@dataclass
class Event:
    """Structure for storing narrative events."""
    timestamp: datetime
    event_type: EventType
    avatar_name: str
    title: str
    description: str
    location: Dict
    participants: List[str]
    outcome: str
    moral_impact: int
    tags: List[str]
    media_refs: Optional[Dict] = None

class NarrativeGenerator:
    def __init__(self):
        self.events: List[Event] = []
        self.subscribers: Dict[str, set] = {}  # avatar_name: set of subscriber_ids
        self.current_episode: Dict[str, List[Event]] = {}  # avatar_name: events
        self.episode_counter: Dict[str, int] = {}  # avatar_name: episode_number
        
    def record_event(self, event: Event) -> None:
        """Record a new event and notify subscribers."""
        self.events.append(event)
        self._add_to_current_episode(event)
        self._notify_subscribers(event)
        logger.info(f"Recorded new event: {event.title} for {event.avatar_name}")

    def _add_to_current_episode(self, event: Event) -> None:
        """Add event to current episode and check if episode should be completed."""
        if event.avatar_name not in self.current_episode:
            self.current_episode[event.avatar_name] = []
            self.episode_counter[event.avatar_name] = 1

        self.current_episode[event.avatar_name].append(event)
        
        # Check if we should complete the episode
        if self._should_complete_episode(event.avatar_name):
            self._complete_episode(event.avatar_name)

    def _should_complete_episode(self, avatar_name: str) -> bool:
        """Determine if current events constitute a complete episode."""
        events = self.current_episode[avatar_name]
        if len(events) < 3:
            return False

        # Check for narrative arc completion
        has_conflict = any(e.event_type == EventType.BATTLE for e in events)
        has_resolution = any(e.event_type in [EventType.ACHIEVEMENT, EventType.MORAL_CHOICE] 
                           for e in events[-2:])
        
        return has_conflict and has_resolution

    def _complete_episode(self, avatar_name: str) -> Dict:
        """Complete current episode and generate summary."""
        episode_events = self.current_episode[avatar_name]
        episode_number = self.episode_counter[avatar_name]
        
        episode = {
            'episode_number': episode_number,
            'avatar_name': avatar_name,
            'title': self._generate_episode_title(episode_events),
            'events': [asdict(event) for event in episode_events],
            'summary': self._generate_episode_summary(episode_events),
            'timestamp': datetime.now(),
            'duration': len(episode_events)
        }

        # Store episode and reset current
        self._save_episode(episode)
        self.current_episode[avatar_name] = []
        self.episode_counter[avatar_name] += 1
        
        return episode

    def _generate_episode_title(self, events: List[Event]) -> str:
        """Generate an anime-style episode title."""
        main_event = max(events, key=lambda e: abs(e.moral_impact))
        
        title_templates = {
            EventType.BATTLE: "Clash! The {outcome} of {avatar_name}!",
            EventType.TRAINING: "Training Arc: {avatar_name}'s New Power!",
            EventType.RELATIONSHIP: "Bonds of {outcome}: {avatar_name}'s Choice!",
            EventType.ACHIEVEMENT: "Victory! {avatar_name}'s Triumph!",
            EventType.MORAL_CHOICE: "Crossroads of Destiny: {avatar_name}'s Decision!",
            EventType.CLAN: "Rise of the {outcome}! {avatar_name}'s Clan!"
        }
        
        template = title_templates.get(main_event.event_type, "{avatar_name}'s Journey Continues!")
        return template.format(
            avatar_name=main_event.avatar_name,
            outcome=main_event.outcome
        )

    def _generate_episode_summary(self, events: List[Event]) -> str:
        """Generate a dramatic episode summary."""
        summary = []
        
        # Opening
        summary.append(f"In this episode of {events[0].avatar_name}'s journey...")
        
        # Main narrative
        for event in events:
            if event.event_type == EventType.BATTLE:
                summary.append(f"An epic battle unfolds as {event.description}")
            elif event.event_type == EventType.MORAL_CHOICE:
                summary.append(f"Faced with a crucial decision, {event.description}")
            else:
                summary.append(event.description)

        # Dramatic ending
        last_event = events[-1]
        summary.append(f"The episode concludes with {last_event.outcome}!")
        
        return "\n".join(summary)

    def subscribe_to_avatar(self, subscriber_id: str, avatar_name: str) -> bool:
        """Subscribe to an avatar's narrative updates."""
        if avatar_name not in self.subscribers:
            self.subscribers[avatar_name] = set()
        
        self.subscribers[avatar_name].add(subscriber_id)
        logger.info(f"Subscriber {subscriber_id} now following {avatar_name}")
        return True

    def _notify_subscribers(self, event: Event) -> None:
        """Notify subscribers of new events."""
        if event.avatar_name in self.subscribers:
            notification = self._create_notification(event)
            for subscriber_id in self.subscribers[event.avatar_name]:
                self._send_notification(subscriber_id, notification)

    def _create_notification(self, event: Event) -> Dict:
        """Create a notification object from an event."""
        return {
            'type': 'narrative_update',
            'avatar_name': event.avatar_name,
            'title': event.title,
            'description': event.description,
            'timestamp': event.timestamp.isoformat(),
            'importance': abs(event.moral_impact)
        }

    def _send_notification(self, subscriber_id: str, notification: Dict) -> None:
        """Send notification to subscriber (placeholder for actual implementation)."""
        # In a real implementation, this would integrate with a notification service
        logger.info(f"Sending notification to {subscriber_id}: {notification['title']}")

    def _save_episode(self, episode: Dict) -> None:
        """Save completed episode to storage (placeholder for actual implementation)."""
        # In a real implementation, this would save to a database
        episode_json = json.dumps(episode, default=str)
        logger.info(f"Saved episode {episode['episode_number']} for {episode['avatar_name']}")

    def get_avatar_episodes(self, avatar_name: str, limit: int = 10) -> List[Dict]:
        """Retrieve recent episodes for an avatar."""
        # Placeholder for database query
        # In a real implementation, this would fetch from storage
        return []

    def get_live_stream(self, avatar_name: str) -> Optional[Dict]:
        """Get current episode in progress for live streaming."""
        if avatar_name in self.current_episode:
            return {
                'avatar_name': avatar_name,
                'current_events': [asdict(event) for event in self.current_episode[avatar_name]],
                'is_live': True,
                'viewer_count': len(self.subscribers.get(avatar_name, set()))
            }
        return None

# Create a new event
event = Event(
    timestamp=datetime.now(),
    event_type=EventType.BATTLE,
    avatar_name="Ninja123",
    title="Epic Showdown at the Dojo",
    description="A fierce battle between rivals",
    location={"name": "Ancient Dojo", "coords": {"lat": 35.6762, "lng": 139.6503}},
    participants=["Ninja123", "Samurai456"],
    outcome="decisive victory",
    moral_impact=10,
    tags=["battle", "rivalry", "dojo"]
)

# Record the event
narrator = NarrativeGenerator()
narrator.record_event(event)

# Subscribe to updates
narrator.subscribe_to_avatar("fan123", "Ninja123")

# Get live stream
live_stream = narrator.get_live_stream("Ninja123")

# Initialize systems
ranking_system = RankingSystem()
spectator_system = SpectatorSystem()
feature_match_system = FeatureMatchSystem(ranking_system, spectator_system)

# Calculate rank for an avatar
rank_data = ranking_system.calculate_rank("Ninja123", {
    'followers': 1000,
    'wins': 50,
    'total_matches': 75,
    'active_spectators': set(['fan1', 'fan2', 'fan3']),
    'highlight_reels': ['highlight1', 'highlight2']
})

# Process sponsorship
sponsorship = ranking_system.process_sponsorship("Ninja123")

# Schedule a feature match
match_id = await feature_match_system.schedule_feature_match(
    "Ninja123", "Samurai456", "Epic Arena", 1000
)

# Start the match and stream
await feature_match_system.start_match(match_id)

# Join stream as spectator
await spectator_system.join_stream(f"stream_{match_id}", "fan123")

# Generate highlight reel
highlights = spectator_system.generate_highlight_reel(
    "Ninja123", timedelta(days=7)
)
