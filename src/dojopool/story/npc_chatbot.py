"""NPC ChatBot: Sends story-driven system/NPC messages to players and rooms."""
from dojopool.story.story_engine import story_engine
from dojopool.models import db
from dojopool.models.chat import ChatRoom, ChatMessage
from dojopool.models.story import PlayerStoryState
from datetime import datetime

class NPCChatBot:
    def __init__(self, npc_name="Sensei Hiroshi"):
        self.npc_name = npc_name

    def send_npc_message_to_room(self, room_id, template_key, player_id=None, extra_context=None):
        # Optionally personalize with a player's story state
        context = extra_context or {}
        if player_id:
            state = PlayerStoryState.query.filter_by(user_id=player_id).first()
            if state:
                context.update({
                    "chapter": state.chapter,
                    "quest": state.quest,
                    **state.flags,
                })
        message_text = story_engine.story_templates.get(template_key, "{base_message}")
        story_message = message_text.format(**context)
        message = ChatMessage(
            room_id=room_id,
            user_id=None,  # None means system/NPC
            content=f"{self.npc_name}: {story_message}",
            created_at=datetime.utcnow(),
        )
        db.session.add(message)
        db.session.commit()
        return message

    def send_npc_message_to_player(self, player_id, template_key, extra_context=None):
        # Could use direct message system as well
        pass  # For future expansion

npc_chatbot = NPCChatBot()
