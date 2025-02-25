class NarrativeService:
    @staticmethod
    def generate(venue_context, match_data):
        if not venue_context:
            raise ValueError("Venue context is required")
        # Business logic could be expanded here.
        return f"In {venue_context}, an epic battle unfolds with these stats: {match_data}" 