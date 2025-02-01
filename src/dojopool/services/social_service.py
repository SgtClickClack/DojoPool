import urllib.parse
from typing import Dict, Optional

from flask import url_for


class SocialService:
    def __init__(self):
        self.share_templates = {
            "twitter": "https://twitter.com/intent/tweet?text={text}&url={url}",
            "facebook": "https://www.facebook.com/sharer/sharer.php?u={url}",
            "linkedin": "https://www.linkedin.com/sharing/share-offsite/?url={url}",
            "whatsapp": "https://api.whatsapp.com/send?text={text}%20{url}",
        }

    def generate_share_links(
        self, content_type: str, content_id: str, title: str, description: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate social sharing links for various platforms."""
        base_url = url_for(f"{content_type}.details", id=content_id, _external=True)

        share_text = f"{title}"
        if description:
            share_text += f" - {description}"

        encoded_text = urllib.parse.quote(share_text)
        encoded_url = urllib.parse.quote(base_url)

        share_links = {}
        for platform, template in self.share_templates.items():
            share_links[platform] = template.format(text=encoded_text, url=encoded_url)

        return share_links

    def generate_achievement_share(
        self, achievement_id: str, name: str, description: str
    ) -> Dict[str, str]:
        """Generate sharing links for an achievement."""
        return self.generate_share_links(
            content_type="achievements",
            content_id=achievement_id,
            title=f"I just unlocked the '{name}' achievement in DojoPool!",
            description=description,
        )

    def generate_tournament_share(
        self, tournament_id: str, name: str, position: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate sharing links for a tournament result."""
        title = f"Check out my tournament results in {name} on DojoPool!"
        if position:
            title = f"I finished {position} in the {name} tournament on DojoPool!"

        return self.generate_share_links(
            content_type="tournaments", content_id=tournament_id, title=title
        )

    def generate_match_share(
        self, match_id: str, opponent_name: str, score: str, won: bool
    ) -> Dict[str, str]:
        """Generate sharing links for a match result."""
        result = "won" if won else "played"
        title = f"I just {result} a match against {opponent_name} ({score}) on DojoPool!"

        return self.generate_share_links(content_type="matches", content_id=match_id, title=title)
