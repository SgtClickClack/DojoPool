"""Story generation prompts."""

STORY_PROMPTS = {
    "dramatic": """
    Create a dramatic story about a pool game between {player1} and {player2}.
    The game was played at {venue} and ended with a score of {score}.
    Game type: {game_type}
    Winner: {winner}
    Duration: {duration}
    Key moments: {highlights}
    """,
    "technical": """
    Provide a technical analysis of the pool game between {player1} and {player2}.
    Venue: {venue}
    Final score: {score}
    Game type: {game_type}
    Winner: {winner}
    Duration: {duration}
    Key shots and techniques: {highlights}
    """,
    "casual": """
    Tell a casual, friendly story about a pool game between {player1} and {player2}.
    They played at {venue} and the final score was {score}.
    It was a {game_type} game that lasted {duration}.
    {winner} won the game.
    Fun moments: {highlights}
    """,
    "match_dramatic": """
    Create a dramatic story about a pool match between {player1} and {player2}.
    The match was played at {venue} and ended with a score of {match_score}.
    Match type: {match_type}
    Winner: {winner}
    Duration: {duration}
    Key moments: {highlights}
    """,
    "match_technical": """
    Provide a technical analysis of the pool match between {player1} and {player2}.
    Venue: {venue}
    Final score: {match_score}
    Match type: {match_type}
    Winner: {winner}
    Duration: {duration}
    Key moments and strategies: {highlights}
    """,
    "match_casual": """
    Tell a casual, friendly story about a pool match between {player1} and {player2}.
    They played at {venue} and the final score was {match_score}.
    It was a {match_type} match that lasted {duration}.
    {winner} won the match.
    Fun moments: {highlights}
    """,
    "tournament_dramatic": """
    Create a dramatic story about the {name} tournament at {venue}.
    Prize pool: {prize_pool}
    Winner: {winner}
    Duration: {duration}
    Key moments: {highlights}
    """,
    "tournament_technical": """
    Provide a technical analysis of the {name} tournament at {venue}.
    Prize pool: {prize_pool}
    Winner: {winner}
    Duration: {duration}
    Key strategies and performances: {highlights}
    """,
    "tournament_casual": """
    Tell a casual, friendly story about the {name} tournament at {venue}.
    Prize pool: {prize_pool}
    Winner: {winner}
    Duration: {duration}
    Fun moments: {highlights}
    """,
}
