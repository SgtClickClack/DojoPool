"""
Templates for AI-powered content generation.
Each template is designed to generate specific types of content with consistent structure and style.
"""

STORY_PROMPT_TEMPLATE = """
Create an engaging match recap for {user_name}'s recent pool game:

Level: {user_level}
Match Type: {match_type}
Duration: {match_duration} minutes
Score: {match_score}

Recent Performance:
{performance_trend}

Key Moments:
{{key_moments}}

Highlight the player's strategy, notable shots, and any significant improvements.
Focus on their strengths while providing constructive insights for areas of improvement.
Keep the tone encouraging and professional.

Additional Context:
{additional_context}
"""

RECOMMENDATION_PROMPT_TEMPLATE = """
Based on {user_name}'s recent performance:

Skill Level: {user_level}
Recent Matches: {match_count}
Average Score: {avg_score}
Win Rate: {win_rate}%

Areas of Focus:
{{focus_areas}}

Training Goals:
{{training_goals}}

Provide specific, actionable recommendations for improvement.
Include practice drills, technique adjustments, and strategic advice.
Tailor the recommendations to their current skill level and recent performance trends.

Special Considerations:
{special_notes}
"""

ANALYSIS_PROMPT_TEMPLATE = """
Detailed match analysis for Game #{match_id}:

Player: {user_name}
Type: {match_type}
Duration: {duration} minutes
Final Score: {score}

Performance Metrics:
- Accuracy: {accuracy}%
- Shot Selection: {shot_selection_rating}
- Position Play: {position_play_rating}
- Speed: {speed_rating}

Key Statistics:
{{key_stats}}

Tactical Analysis:
{{tactical_analysis}}

Recommendations:
{{recommendations}}

Include specific examples from the match to illustrate points.
Focus on both strengths demonstrated and areas for improvement.
Provide actionable insights for future matches.

Additional Notes:
{notes}
"""

TRAINING_PLAN_TEMPLATE = """
Personalized Training Plan for {user_name}

Current Level: {user_level}
Focus Areas: {focus_areas}
Time Available: {available_time} minutes

Warm-up Routine:
{{warmup_routine}}

Main Exercises:
{{exercises}}

Cool-down Practice:
{{cooldown}}

Progress Tracking:
- Initial Metrics: {initial_metrics}
- Target Metrics: {target_metrics}
- Timeline: {timeline}

Adjust the intensity and complexity based on progress.
Track improvements in accuracy, consistency, and speed.
Regular assessment and plan updates recommended.

Special Instructions:
{special_instructions}
"""

DIFFICULTY_ADJUSTMENT_TEMPLATE = """
Adaptive Difficulty Settings for {user_name}

Current Performance:
- Win Rate: {win_rate}%
- Average Score: {avg_score}
- Consistency Rating: {consistency}

Recommended Adjustments:
{{adjustments}}

Game Parameters:
- Speed: {speed_setting}
- Complexity: {complexity_level}
- Assistance: {assistance_level}

The settings are designed to maintain a challenge while ensuring steady progress.
Regular adjustments will be made based on performance improvements.

Notes:
{adjustment_notes}
"""

PERFORMANCE_FEEDBACK_TEMPLATE = """
Performance Analysis for {user_name}
Session Date: {session_date}

Overview:
- Duration: {duration} minutes
- Matches Played: {matches_played}
- Overall Rating: {overall_rating}

Strengths Demonstrated:
{{strengths}}

Areas for Improvement:
{{improvements}}

Specific Observations:
{{observations}}

Next Steps:
{{next_steps}}

Keep focusing on consistent improvement while maintaining good fundamentals.
Regular practice with these focus areas will lead to noticeable progress.

Additional Comments:
{comments}
"""
