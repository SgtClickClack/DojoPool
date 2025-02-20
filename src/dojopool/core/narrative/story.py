import json
import logging
import random
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class SkillLevel(Enum):
    NOVICE = "novice"
    APPRENTICE = "apprentice"
    JOURNEYMAN = "journeyman"
    MASTER = "master"
    GRANDMASTER = "grandmaster"


class AchievementType(Enum):
    FIRST_WIN = "first_win"
    WINNING_STREAK = "winning_streak"
    PERFECT_GAME = "perfect_game"
    TRICK_SHOT = "trick_shot"
    TOURNAMENT_WIN = "tournament_win"
    VENUE_MASTERY = "venue_mastery"
    SKILL_MILESTONE = "skill_milestone"


@dataclass
class StoryNode:
    """Represents a single story beat or narrative element."""

    id: str
    title: str
    description: str
    requirements: Dict[str, Any]
    next_nodes: List[str]
    achievement_type: Optional[AchievementType] = None
    skill_level: Optional[SkillLevel] = None


@dataclass
class QuestObjective:
    """Represents a specific objective within a quest."""

    description: str
    target_value: int
    current_value: int = 0
    completed: bool = False


class Quest:
    """Represents a pool-related quest or challenge."""

    def __init__(
        self,
        quest_id: str,
        title: str,
        description: str,
        objectives: List[QuestObjective],
        reward_exp: int,
        required_skill_level: SkillLevel,
    ):
        self.quest_id = quest_id
        self.title = title
        self.description = description
        self.objectives = objectives
        self.reward_exp = reward_exp
        self.required_skill_level = required_skill_level
        self.completed = False
        self.active = False

    def update_progress(self, objective_index: int, value: int) -> bool:
        """Update progress for a specific objective."""
        if objective_index >= len(self.objectives):
            return False

        objective = self.objectives[objective_index]
        objective.current_value = min(value, objective.target_value)
        objective.completed = objective.current_value >= objective.target_value

        # Check if all objectives are completed
        self.completed = all(obj.completed for obj in self.objectives)
        return self.completed

    def to_dict(self) -> Dict[str, Any]:
        """Convert quest to dictionary format."""
        return {
            "quest_id": self.quest_id,
            "title": self.title,
            "description": self.description,
            "objectives": [
                {
                    "description": obj.description,
                    "target_value": obj.target_value,
                    "current_value": obj.current_value,
                    "completed": obj.completed,
                }
                for obj in self.objectives
            ],
            "reward_exp": self.reward_exp,
            "required_skill_level": self.required_skill_level.value,
            "completed": self.completed,
            "active": self.active,
        }


class StoryManager:
    """Manages story progression and quest generation."""

    def __init__(self, story_data_path: str):
        self.story_data_path = Path(story_data_path)
        self.story_nodes: Dict[str, StoryNode] = {}
        self.active_quests: Dict[str, Quest] = {}
        self.completed_quests: Dict[str, Quest] = {}
        self.load_story_data()

    def load_story_data(self):
        """Load story nodes and quest templates from JSON files."""
        try:
            # Load story structure
            story_file = self.story_data_path / "story_nodes.json"
            if story_file.exists():
                with open(story_file, "r") as f:
                    data = json.load(f)
                    for node_data in data["nodes"]:
                        node = StoryNode(
                            id=node_data["id"],
                            title=node_data["title"],
                            description=node_data["description"],
                            requirements=node_data["requirements"],
                            next_nodes=node_data["next_nodes"],
                            achievement_type=(
                                AchievementType(node_data.get("achievement_type"))
                                if node_data.get("achievement_type")
                                else None
                            ),
                            skill_level=(
                                SkillLevel(node_data.get("skill_level"))
                                if node_data.get("skill_level")
                                else None
                            ),
                        )
                        self.story_nodes[node.id] = node

            logger.info(f"Loaded {len(self.story_nodes)} story nodes")

        except Exception as e:
            logger.error(f"Failed to load story data: {str(e)}")

    def generate_quest(self, player_skill: SkillLevel):
        """Generate a new quest based on player's skill level."""
        try:
            # Load quest templates
            quest_file = self.story_data_path / "quest_templates.json"
            if not quest_file.exists():
                logger.error("Quest templates file not found")
                return None

            with open(quest_file, "r") as f:
                templates = json.load(f)

            # Filter templates by skill level
            suitable_templates = [
                t
                for t in templates
                if SkillLevel(t["required_skill_level"]) == player_skill
            ]

            if not suitable_templates:
                return None

            # Select random template
            template = random.choice(suitable_templates)

            # Generate quest objectives
            objectives = [
                QuestObjective(
                    description=obj["description"], target_value=obj["target_value"]
                )
                for obj in template["objectives"]
            ]

            # Create new quest
            quest = Quest(
                quest_id=f"quest_{len(self.active_quests) + len(self.completed_quests) + 1}",
                title=template["title"],
                description=template["description"],
                objectives=objectives,
                reward_exp=template["reward_exp"],
                required_skill_level=player_skill,
            )

            return quest

        except Exception as e:
            logger.error(f"Failed to generate quest: {str(e)}")
            return None

    def get_available_quests(self, player_skill: SkillLevel, max_quests: int = 3):
        """Get available quests for the player."""
        available = []
        while len(available) < max_quests:
            quest = self.generate_quest(player_skill)
            if quest:
                available.append(quest)
        return available

    def activate_quest(self, quest: Quest):
        """Activate a quest for tracking."""
        if len(self.active_quests) >= 3:
            return False

        quest.active = True
        self.active_quests[quest.quest_id] = quest
        return True

    def complete_quest(self, quest_id: str) -> Optional[int]:
        """Complete a quest and return reward experience."""
        if quest_id not in self.active_quests:
            return None

        quest = self.active_quests.pop(quest_id)
        if not quest.completed:
            return None

        self.completed_quests[quest_id] = quest
        return quest.reward_exp

    def get_next_story_nodes(
        self, current_node_id: str, player_achievements: List[str]
    ):
        """Get available next story nodes based on current progress."""
        if current_node_id not in self.story_nodes:
            return []

        current_node = self.story_nodes[current_node_id]
        available_nodes = []

        for next_node_id in current_node.next_nodes:
            if next_node_id in self.story_nodes:
                next_node = self.story_nodes[next_node_id]
                if self._check_requirements(
                    next_node.requirements, player_achievements
                ):
                    available_nodes.append(next_node)

        return available_nodes

    def _check_requirements(
        self, requirements: Dict[str, Any], player_achievements: List[str]
    ):
        """Check if player meets node requirements."""
        for req_type, req_value in requirements.items():
            if req_type == "achievements":
                if not all(ach in player_achievements for ach in req_value):
                    return False
            # Add more requirement types as needed
        return True

    def get_story_progress(self, player_id: str):
        """Get player's story progress summary."""
        return {
            "active_quests": [quest.to_dict() for quest in self.active_quests.values()],
            "completed_quests": [
                quest.to_dict() for quest in self.completed_quests.values()
            ],
            "total_exp_earned": sum(
                quest.reward_exp for quest in self.completed_quests.values()
            ),
        }
