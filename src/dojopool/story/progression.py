"""Story progression logic: advancing chapters, quests, and triggering story events."""
from dojopool.models import db
from dojopool.models.story import PlayerStoryState, StoryEvent
from datetime import datetime

class StoryProgression:
    def __init__(self):
        pass

    def get_or_create_story_state(self, user_id):
        state = PlayerStoryState.query.filter_by(user_id=user_id).first()
        if not state:
            state = PlayerStoryState(user_id=user_id, chapter="Prologue", quest="Begin your journey", flags={})
            db.session.add(state)
            db.session.commit()
        return state

    def advance_chapter(self, user_id, new_chapter, quest=None, flags_update=None):
        state = self.get_or_create_story_state(user_id)
        state.chapter = new_chapter
        if quest:
            state.quest = quest
        if flags_update:
            state.flags.update(flags_update)
        state.updated_at = datetime.utcnow()
        db.session.commit()
        self.log_event(user_id, "chapter_advanced", {"chapter": new_chapter, "quest": quest, "flags": flags_update})
        return state

    def complete_quest(self, user_id, quest_name):
        state = self.get_or_create_story_state(user_id)
        state.flags[f"quest_completed_{quest_name}"] = True
        db.session.commit()
        self.log_event(user_id, "quest_completed", {"quest": quest_name})
        return state

    def log_event(self, user_id, event_type, data=None):
        event = StoryEvent(user_id=user_id, event_type=event_type, data=data or {})
        db.session.add(event)
        db.session.commit()
        return event

    def set_flag(self, user_id, flag, value=True):
        state = self.get_or_create_story_state(user_id)
        state.flags[flag] = value
        db.session.commit()
        self.log_event(user_id, "flag_set", {"flag": flag, "value": value})
        return state

story_progression = StoryProgression()
