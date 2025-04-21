from flask import request
from flask_restful import Resource
from flask_login import current_user, login_required

class UserMeResource(Resource):
    @login_required
    def get(self):
        # Return the current user's profile as JSON
        user = current_user
        return user.to_dict(), 200
