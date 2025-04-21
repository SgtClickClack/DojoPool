from flask_restful import Resource
from dojopool.core.models.venue import Venue

class VenuesResource(Resource):
    def get(self):
        venues = Venue.query.all()
        return {'venues': [venue.to_dict() for venue in venues]}, 200
