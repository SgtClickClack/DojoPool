from flask import request
from flask_restful import Resource
from flask_login import current_user, login_required

class UserMeResource(Resource):
    @login_required
    def get(self):
        user = current_user
        print('DEBUG: current_user type:', type(user))
        print('DEBUG: current_user.to_dict:', getattr(user, 'to_dict', None))
        result = user.to_dict()
        print('DEBUG: user.to_dict() result:', result)
        return result, 200
