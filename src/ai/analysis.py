"""Module for AI-powered match analysis and insights."""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import numpy as np
from .difficulty import AdaptiveDifficulty
from .service import ai_service
from src.models import Match, Game, Event, Shot
from src.core.database import db

class MatchAnalyzer:
    """Provides AI-powered analysis for pool matches."""
    
    def __init__(self):
        """Initialize match analyzer."""
        self.cache = {}  # Simple in-memory cache for analysis results
        self.difficulty = AdaptiveDifficulty()
    
    async def analyze_match(self, match_id: int) -> Dict[str, Any]:
        """Perform comprehensive analysis of a match."""
        # Check cache first
        if match_id in self.cache:
            return self.cache[match_id]
        
        match = await db.session.query(Match).get(match_id)
        if not match:
            return self._get_empty_analysis()
        
        # Get player levels
        player1_levels = await self.difficulty.calculate_player_level(match.player1_id)
        player2_levels = await self.difficulty.calculate_player_level(match.player2_id)
        
        # Perform various analyses
        key_moments = await self._analyze_key_moments(match)
        performance_stats = await self._analyze_performance(match)
        tactical_analysis = await self._analyze_tactics(match, player1_levels, player2_levels)
        improvement_areas = await self._identify_improvement_areas(match, player1_levels, player2_levels)
        
        analysis = {
            'match_summary': await self._generate_match_summary(match),
            'key_moments': key_moments,
            'performance_stats': performance_stats,
            'tactical_analysis': tactical_analysis,
            'improvement_areas': improvement_areas,
            'player_insights': {
                'player1': await self._generate_player_insights(match.player1_id, match),
                'player2': await self._generate_player_insights(match.player2_id, match)
            }
        }
        
        # Cache the results
        self.cache[match_id] = analysis
        return analysis
    
    def _get_empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure."""
        return {
            'match_summary': "Match not found",
            'key_moments': [],
            'performance_stats': {},
            'tactical_analysis': {},
            'improvement_areas': {},
            'player_insights': {'player1': {}, 'player2': {}}
        }
    
    async def _analyze_key_moments(self, match: Match) -> List[Dict[str, Any]]:
        """Analyze key moments in the match."""
        key_moments = []
        
        # Get match events
        events = await db.session.query(Event).filter_by(match_id=match.id).all()
        
        for event in events:
            # Analyze event significance
            significance = await self._calculate_event_significance(event, match)
            
            if significance > 0.7:  # Only include significant moments
                key_moments.append({
                    'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                    'description': event.description,
                    'significance': significance,
                    'impact': await self._analyze_event_impact(event, match),
                    'player_id': event.player_id
                })
        
        return sorted(key_moments, key=lambda x: x['significance'], reverse=True)
    
    async def _analyze_performance(self, match: Match) -> Dict[str, Any]:
        """Analyze performance statistics for the match."""
        shots = await db.session.query(Shot).filter_by(match_id=match.id).all()
        events = await db.session.query(Event).filter_by(match_id=match.id).all()
        
        stats = {
            'accuracy': self._calculate_shot_accuracy(shots),
            'consistency': self._calculate_consistency_stats(shots),
            'pressure_handling': self._calculate_pressure_stats(events),
            'shot_selection': await self._analyze_shot_selection(shots)
        }
        
        # Get AI insights on performance
        performance_prompt = f"""
Analyze the following performance statistics for a pool match:

{json.dumps(stats, indent=2)}

Provide insights on:
1. Notable performance patterns
2. Key strengths demonstrated
3. Areas where improvement was needed
4. How the statistics affected the match outcome

Provide the analysis in JSON format.
"""
        
        analysis = await ai_service.generate_text(performance_prompt)
        if analysis:
            try:
                stats['ai_insights'] = json.loads(analysis)
            except json.JSONDecodeError:
                stats['ai_insights'] = {}
        
        return stats
    
    async def _analyze_tactics(self, match: Match, player1_levels: Dict, player2_levels: Dict) -> Dict[str, Any]:
        """Analyze tactical aspects of the match."""
        events = await db.session.query(Event).filter_by(match_id=match.id).all()
        shots = await db.session.query(Shot).filter_by(match_id=match.id).all()
        
        tactical_data = {
            'shot_patterns': await self._analyze_shot_patterns(shots),
            'strategic_decisions': await self._analyze_strategic_decisions(events),
            'adaptations': await self._analyze_tactical_adaptations(events, shots),
            'player_matchup': {
                'style_clash': self._analyze_style_clash(player1_levels, player2_levels),
                'strength_exploitation': self._analyze_strength_exploitation(events, player1_levels, player2_levels)
            }
        }
        
        return tactical_data
    
    async def _identify_improvement_areas(self, match: Match, player1_levels: Dict, player2_levels: Dict) -> Dict[str, List[str]]:
        """Identify areas for improvement for both players."""
        events = await db.session.query(Event).filter_by(match_id=match.id).all()
        shots = await db.session.query(Shot).filter_by(match_id=match.id).all()
        
        # Analyze match data for improvement areas
        match_data = {
            'events': [e.to_dict() for e in events],
            'shots': [s.to_dict() for s in shots],
            'score_progression': await self._get_score_progression(match),
            'player1_levels': player1_levels,
            'player2_levels': player2_levels
        }
        
        # Get AI recommendations
        improvement_prompt = f"""
Analyze the following match data and identify areas for improvement:

{json.dumps(match_data, indent=2)}

For each player, identify:
1. Technical improvements needed
2. Tactical adjustments recommended
3. Mental game enhancements
4. Strategic adaptations

Provide the analysis in JSON format with separate sections for each player.
"""
        
        analysis = await ai_service.generate_text(improvement_prompt)
        if analysis:
            try:
                improvements = json.loads(analysis)
                return {
                    'player1': improvements.get('player1_improvements', []),
                    'player2': improvements.get('player2_improvements', [])
                }
            except json.JSONDecodeError:
                pass
        
        return {
            'player1': ["Focus on fundamentals", "Work on consistency"],
            'player2': ["Focus on fundamentals", "Work on consistency"]
        }
    
    async def _generate_player_insights(self, player_id: int, match: Match) -> Dict[str, Any]:
        """Generate detailed insights for a player's performance."""
        events = await db.session.query(Event).filter_by(
            match_id=match.id,
            player_id=player_id
        ).all()
        
        shots = await db.session.query(Shot).filter_by(
            match_id=match.id,
            player_id=player_id
        ).all()
        
        # Calculate various metrics
        metrics = {
            'shot_accuracy': self._calculate_shot_accuracy(shots),
            'decision_quality': self._calculate_decision_quality(events),
            'pressure_performance': self._calculate_pressure_performance(events),
            'adaptability': self._calculate_adaptability(events, shots)
        }
        
        # Get AI insights
        insights_prompt = f"""
Analyze the following player metrics from a pool match:

{json.dumps(metrics, indent=2)}

Provide insights on:
1. Key strengths demonstrated
2. Areas for improvement
3. Notable patterns or tendencies
4. Recommendations for future matches

Provide the analysis in JSON format.
"""
        
        analysis = await ai_service.generate_text(insights_prompt)
        if analysis:
            try:
                metrics['ai_insights'] = json.loads(analysis)
            except json.JSONDecodeError:
                metrics['ai_insights'] = {}
        
        return metrics
    
    async def _generate_match_summary(self, match: Match) -> str:
        """Generate a comprehensive match summary."""
        events = await db.session.query(Event).filter_by(match_id=match.id).all()
        
        summary_prompt = f"""
Generate a comprehensive summary for a pool match:

Players: {match.player1.username} vs {match.player2.username}
Final Score: {match.player1_score} - {match.player2_score}
Duration: {match.duration}
Key Events: {[e.description for e in events]}

Create a narrative that captures:
1. The flow of the match
2. Critical moments
3. Player performances
4. The significance of the outcome
"""
        
        summary = await ai_service.generate_text(summary_prompt)
        return summary or f"Match between {match.player1.username} and {match.player2.username}"
    
    async def _get_score_progression(self, match: Match) -> List[Dict[str, Any]]:
        """Get the score progression throughout the match."""
        events = await db.session.query(Event).filter_by(
            match_id=match.id,
            type='score_update'
        ).order_by(Event.timestamp).all()
        
        return [
            {
                'timestamp': e.timestamp.isoformat() if e.timestamp else None,
                'player1_score': e.data.get('player1_score'),
                'player2_score': e.data.get('player2_score')
            }
            for e in events
        ]
    
    async def _calculate_event_significance(self, event: Event, match: Match) -> float:
        """Calculate the significance of a match event."""
        # Implement event significance calculation logic
        return 0.8  # Placeholder
    
    async def _analyze_event_impact(self, event: Event, match: Match) -> Dict[str, Any]:
        """Analyze the impact of a match event."""
        # Implement event impact analysis logic
        return {
            'momentum_shift': 0.5,
            'score_impact': 0.3,
            'psychological_impact': 0.7
        }
    
    async def _analyze_shot_selection(self, shots: List[Shot]) -> Dict[str, Any]:
        """Analyze shot selection patterns."""
        # Implement shot selection analysis logic
        return {
            'aggressive_shots': 0.4,
            'safety_plays': 0.3,
            'risk_taking': 0.5
        }
    
    async def _analyze_shot_patterns(self, shots: List[Shot]) -> Dict[str, Any]:
        """Analyze patterns in shot selection and execution."""
        # Implement shot pattern analysis logic
        return {
            'preferred_shots': ['straight', 'cut'],
            'success_rates': {'straight': 0.8, 'cut': 0.7},
            'patterns': ['aggressive_early', 'conservative_late']
        }
    
    async def _analyze_strategic_decisions(self, events: List[Event]) -> Dict[str, Any]:
        """Analyze strategic decision making."""
        # Implement strategic decision analysis logic
        return {
            'decision_quality': 0.75,
            'adaptability': 0.8,
            'patterns': ['aggressive_when_ahead', 'defensive_when_behind']
        }
    
    async def _analyze_tactical_adaptations(self, events: List[Event], shots: List[Shot]) -> Dict[str, Any]:
        """Analyze tactical adaptations during the match."""
        # Implement tactical adaptation analysis logic
        return {
            'adaptation_speed': 0.7,
            'effectiveness': 0.8,
            'key_adjustments': ['changed_break_pattern', 'adjusted_shot_selection']
        }
    
    def _analyze_style_clash(self, player1_levels: Dict, player2_levels: Dict) -> Dict[str, Any]:
        """Analyze the clash of playing styles."""
        # Implement style clash analysis logic
        return {
            'compatibility': 0.6,
            'advantage': 'player1',
            'key_factors': ['speed', 'shot_selection']
        }
    
    def _analyze_strength_exploitation(self, events: List[Event], player1_levels: Dict, player2_levels: Dict) -> Dict[str, Any]:
        """Analyze how well players exploited strengths/weaknesses."""
        # Implement strength exploitation analysis logic
        return {
            'player1_exploitation': 0.7,
            'player2_exploitation': 0.6,
            'key_patterns': ['targeted_weaknesses', 'leveraged_strengths']
        }
    
    def _calculate_shot_accuracy(self, shots: List[Shot]) -> float:
        """Calculate shot accuracy from shot data."""
        if not shots:
            return 0.0
        return len([s for s in shots if s.successful]) / len(shots)
    
    def _calculate_consistency_stats(self, shots: List[Shot]) -> Dict[str, float]:
        """Calculate consistency statistics."""
        if not shots:
            return {'overall': 0.0, 'streaks': 0.0}
        
        successful_shots = [s for s in shots if s.successful]
        return {
            'overall': len(successful_shots) / len(shots),
            'streaks': self._calculate_streaks(shots)
        }
    
    def _calculate_streaks(self, shots: List[Shot]) -> float:
        """Calculate streak statistics."""
        if not shots:
            return 0.0
        
        max_streak = current_streak = 0
        for shot in shots:
            if shot.successful:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        
        return max_streak
    
    def _calculate_decision_quality(self, events: List[Event]) -> float:
        """Calculate decision quality from event data."""
        if not events:
            return 0.0
        return len([e for e in events if e.decision_rating > 0.7]) / len(events)
    
    def _calculate_pressure_stats(self, events: List[Event]) -> Dict[str, float]:
        """Calculate performance under pressure."""
        pressure_events = [e for e in events if e.pressure_level > 0.7]
        if not pressure_events:
            return {'success_rate': 0.0, 'adaptation': 0.0}
        
        return {
            'success_rate': len([e for e in pressure_events if e.outcome == 'success']) / len(pressure_events),
            'adaptation': self._calculate_pressure_adaptation(pressure_events)
        }
    
    def _calculate_pressure_adaptation(self, events: List[Event]) -> float:
        """Calculate adaptation to pressure situations."""
        if len(events) < 2:
            return 0.0
        
        improvements = 0
        for i in range(1, len(events)):
            if (events[i].outcome == 'success' and 
                events[i-1].outcome == 'failure'):
                improvements += 1
        
        return improvements / (len(events) - 1)
    
    def _calculate_adaptability(self, events: List[Event], shots: List[Shot]) -> float:
        """Calculate player's adaptability during the match."""
        if not events or not shots:
            return 0.0
            
        # Analyze pattern changes and adjustments
        pattern_changes = self._detect_pattern_changes(shots)
        successful_adjustments = self._count_successful_adjustments(events)
        
        return (pattern_changes + successful_adjustments) / (len(events) + len(shots))
    
    def _detect_pattern_changes(self, shots: List[Shot]) -> int:
        """Detect number of significant pattern changes in shots."""
        if len(shots) < 5:
            return 0
            
        pattern_changes = 0
        window_size = 5
        
        for i in range(len(shots) - window_size):
            window1 = shots[i:i+window_size]
            window2 = shots[i+window_size:i+2*window_size]
            
            if len(window2) == window_size:
                if self._is_pattern_different(window1, window2):
                    pattern_changes += 1
                    
        return pattern_changes
    
    def _is_pattern_different(self, shots1: List[Shot], shots2: List[Shot]) -> bool:
        """Compare two sequences of shots for pattern differences."""
        # Simple comparison of shot types and outcomes
        pattern1 = [(s.type, s.successful) for s in shots1]
        pattern2 = [(s.type, s.successful) for s in shots2]
        
        return pattern1 != pattern2
    
    def _count_successful_adjustments(self, events: List[Event]) -> int:
        """Count number of successful strategic adjustments."""
        adjustments = 0
        
        for i in range(1, len(events)):
            if (events[i].type == 'adjustment' and 
                events[i].outcome == 'success' and 
                events[i-1].outcome == 'failure'):
                adjustments += 1
                
        return adjustments

# Initialize match analyzer
match_analyzer = MatchAnalyzer() 