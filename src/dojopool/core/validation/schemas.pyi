from datetime import datetime

from marshmallow import Schema, ValidationError, fields, validate, validates

class UserSchema(Schema):
    pass

class LoginSchema(Schema):
    pass

class GameSettingsSchema(Schema):
    pass

class PaginationSchema(Schema):
    pass

class DateRangeSchema(Schema):
    pass

class GameScoreSchema(Schema):
    pass

class TimeSlotSchema(Schema):
    pass

class PlayerHandicapSchema(Schema):
    pass

class TournamentSchema(Schema):
    pass

class MatchSchema(Schema):
    pass
