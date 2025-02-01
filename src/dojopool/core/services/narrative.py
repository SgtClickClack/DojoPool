"""
Narrative generation service for creating game commentary and stories.
"""

import openai

from src.core.config import AI_CONFIG
from src.extensions import cache


class NarrativeGenerator:
    """AI narrative generator."""

    def __init__(self):
        """Initialize narrative generator."""
        openai.api_key = AI_CONFIG["OPENAI_API_KEY"]
        # Load pre-trained model and tokenizer
        self.model = GPT2LMHeadModel.from_pretrained(AI_CONFIG["NARRATIVE_MODEL_PATH"])
        self.tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

    def generate_match_story(self, game_id, tone="encouraging", length="medium"):
        """Generate narrative for a match.

        Args:
            game_id: Game ID
            tone: Narrative tone
            length: Story length

        Returns:
            dict: Generated narrative
        """
        # Try to get from cache
        cache_key = f"match_story:{game_id}:{tone}:{length}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Get game data
        from src.core.models import Game

        game = Game.query.get(game_id)
        if not game:
            return None

        # Generate story elements
        story = {
            "setup": self._generate_setup(game),
            "challenge": self._generate_challenge(game),
            "action": self._generate_action(game),
            "outcome": self._generate_outcome(game),
            "reflection": self._generate_reflection(game),
        }

        # Combine elements into full narrative
        narrative = self._combine_elements(
            story, tone=tone, max_length=NARRATIVE_CONFIG["length_options"][length]
        )

        # Add metadata
        result = {
            "narrative": narrative,
            "story_elements": story,
            "metadata": {
                "game_id": game_id,
                "tone": tone,
                "length": length,
                "generated_at": datetime.utcnow().isoformat(),
            },
        }

        # Cache result
        cache.set(cache_key, result, timeout=3600)  # 1 hour

        return result

    def generate_player_story(self, user_id, timeframe=None):
        """Generate narrative about player's journey.

        Args:
            user_id: User ID
            timeframe: Optional timeframe in days

        Returns:
            dict: Generated narrative
        """
        # Try to get from cache
        cache_key = f"player_story:{user_id}:{timeframe}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Get player data
        from src.core.models import GameResult, User

        user = User.query.get(user_id)
        if not user:
            return None

        # Get player statistics
        stats = GameResult.get_player_stats(user_id, timeframe=timeframe)
        if not stats:
            return None

        # Generate story elements
        story = {
            "introduction": self._generate_player_intro(user),
            "achievements": self._generate_achievements(user, stats),
            "progress": self._generate_progress(user, stats),
            "style": self._generate_playing_style(user),
            "goals": self._generate_future_goals(user, stats),
        }

        # Combine elements into full narrative
        narrative = self._combine_player_elements(
            story, tone="analytical", max_length=NARRATIVE_CONFIG["length_options"]["long"]
        )

        # Add metadata
        result = {
            "narrative": narrative,
            "story_elements": story,
            "metadata": {
                "user_id": user_id,
                "timeframe": timeframe,
                "generated_at": datetime.utcnow().isoformat(),
            },
        }

        # Cache result
        cache.set(cache_key, result, timeout=3600)  # 1 hour

        return result

    def _generate_setup(self, game):
        """Generate story setup.

        Args:
            game: Game instance

        Returns:
            str: Generated setup
        """
        # Create prompt
        prompt = f"""
        Setting: {game.venue.name}
        Game Type: {game.type.name}
        Players: {', '.join(p.user.username for p in game.players)}
        Time: {game.start_time.strftime('%I:%M %p')}

        Generate an engaging setup for this pool game:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_challenge(self, game):
        """Generate story challenge.

        Args:
            game: Game instance

        Returns:
            str: Generated challenge
        """
        # Create prompt
        prompt = f"""
        Game Type: {game.type.name}
        Format: {game.format} {game.format_value}
        Players: {', '.join(p.user.username for p in game.players)}

        Describe the challenge and stakes of this game:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_action(self, game):
        """Generate story action.

        Args:
            game: Game instance

        Returns:
            str: Generated action
        """
        # Create prompt
        prompt = f"""
        Game Progress:
        - Duration: {game.duration} minutes
        - Score: {game.score}
        - Key Moments: {self._extract_key_moments(game)}

        Describe the key action and turning points:
        """

        return self._generate_text(prompt, max_length=150)

    def _generate_outcome(self, game):
        """Generate story outcome.

        Args:
            game: Game instance

        Returns:
            str: Generated outcome
        """
        # Create prompt
        prompt = f"""
        Winner: {game.winner.username if game.winner else 'TBD'}
        Final Score: {game.winning_score}
        Duration: {game.duration} minutes

        Describe the game's conclusion:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_reflection(self, game):
        """Generate story reflection.

        Args:
            game: Game instance

        Returns:
            str: Generated reflection
        """
        # Create prompt
        prompt = f"""
        Game Statistics:
        {json.dumps(game.stats, indent=2)}

        Provide thoughtful reflection on the game:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_player_intro(self, user):
        """Generate player introduction.

        Args:
            user: User instance

        Returns:
            str: Generated introduction
        """
        # Create prompt
        prompt = f"""
        Player: {user.username}
        Experience: {user.experience_level}
        Joined: {user.created_at.strftime('%B %Y')}

        Write an introduction for this pool player:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_achievements(self, user, stats):
        """Generate player achievements.

        Args:
            user: User instance
            stats: Player statistics

        Returns:
            str: Generated achievements
        """
        # Create prompt
        prompt = f"""
        Statistics:
        - Games Played: {stats['total_games']}
        - Win Rate: {stats['win_rate']}%
        - Achievements: {self._get_user_achievements(user)}

        Highlight the player's achievements:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_progress(self, user, stats):
        """Generate player progress.

        Args:
            user: User instance
            stats: Player statistics

        Returns:
            str: Generated progress
        """
        # Create prompt
        prompt = f"""
        Progress Metrics:
        - Skill Rating: {user.skill_rating}
        - Recent Performance: {self._analyze_recent_performance(user)}
        - Areas of Improvement: {self._identify_improvement_areas(user)}

        Describe the player's progress:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_playing_style(self, user):
        """Generate player style description.

        Args:
            user: User instance

        Returns:
            str: Generated style description
        """
        # Create prompt
        prompt = f"""
        Playing Style:
        - Preferred Games: {self._get_preferred_games(user)}
        - Strengths: {self._identify_strengths(user)}
        - Signature Shots: {self._identify_signature_shots(user)}

        Describe the player's unique style:
        """

        return self._generate_text(prompt, max_length=100)

    def _generate_future_goals(self, user, stats):
        """Generate player goals.

        Args:
            user: User instance
            stats: Player statistics

        Returns:
            str: Generated goals
        """
        # Create prompt
        prompt = f"""
        Current Level: {user.skill_rating}
        Recent Progress: {self._analyze_recent_progress(user)}
        Next Milestones: {self._identify_next_milestones(user)}

        Suggest future goals and aspirations:
        """

        return self._generate_text(prompt, max_length=100)

    def _combine_elements(self, story, tone, max_length):
        """Combine story elements into narrative.

        Args:
            story: Story elements
            tone: Narrative tone
            max_length: Maximum length

        Returns:
            str: Combined narrative
        """
        # Create prompt
        prompt = f"""
        Story Elements:
        {json.dumps(story, indent=2)}

        Tone: {tone}

        Combine these elements into a cohesive narrative:
        """

        return self._generate_text(prompt, max_length=max_length)

    def _combine_player_elements(self, story, tone, max_length):
        """Combine player story elements.

        Args:
            story: Story elements
            tone: Narrative tone
            max_length: Maximum length

        Returns:
            str: Combined narrative
        """
        # Create prompt
        prompt = f"""
        Player Story Elements:
        {json.dumps(story, indent=2)}

        Tone: {tone}

        Create a comprehensive player profile:
        """

        return self._generate_text(prompt, max_length=max_length)

    def _generate_text(self, prompt, max_length):
        """Generate text using model.

        Args:
            prompt: Text prompt
            max_length: Maximum length

        Returns:
            str: Generated text
        """
        # Encode prompt
        inputs = self.tokenizer.encode(
            prompt,
            return_tensors="pt",
            max_length=AI_CONFIG["NARRATIVE_MAX_LENGTH"],
            truncation=True,
        )

        # Generate text
        outputs = self.model.generate(
            inputs,
            max_length=max_length,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            no_repeat_ngram_size=3,
            do_sample=True,
        )

        # Decode and clean up text
        text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return text.strip()

    def _extract_key_moments(self, game):
        """Extract key moments from game.

        Args:
            game: Game instance

        Returns:
            list: Key moments
        """
        # Implement key moment extraction logic
        return []  # Placeholder

    def _get_user_achievements(self, user):
        """Get user achievements.

        Args:
            user: User instance

        Returns:
            list: Achievements
        """
        # Implement achievement retrieval logic
        return []  # Placeholder

    def _analyze_recent_performance(self, user):
        """Analyze recent performance.

        Args:
            user: User instance

        Returns:
            dict: Performance analysis
        """
        # Implement performance analysis logic
        return {}  # Placeholder

    def _identify_improvement_areas(self, user):
        """Identify areas for improvement.

        Args:
            user: User instance

        Returns:
            list: Improvement areas
        """
        # Implement improvement area identification logic
        return []  # Placeholder

    def _get_preferred_games(self, user):
        """Get preferred game types.

        Args:
            user: User instance

        Returns:
            list: Preferred games
        """
        # Implement game preference logic
        return []  # Placeholder

    def _identify_strengths(self, user):
        """Identify player strengths.

        Args:
            user: User instance

        Returns:
            list: Player strengths
        """
        # Implement strength identification logic
        return []  # Placeholder

    def _identify_signature_shots(self, user):
        """Identify signature shots.

        Args:
            user: User instance

        Returns:
            list: Signature shots
        """
        # Implement signature shot identification logic
        return []  # Placeholder

    def _analyze_recent_progress(self, user):
        """Analyze recent progress.

        Args:
            user: User instance

        Returns:
            dict: Progress analysis
        """
        # Implement progress analysis logic
        return {}  # Placeholder

    def _identify_next_milestones(self, user):
        """Identify next milestones.

        Args:
            user: User instance

        Returns:
            list: Next milestones
        """
        # Implement milestone identification logic
        return []  # Placeholder
