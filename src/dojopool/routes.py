from flask import render_template
from dojopool import app

@app.route('/')
def index():
    return render_template('landing.html', api_key=app.config['GOOGLE_MAPS_API_KEY'])

@app.route('/map')
def map_page():
    return render_template('map.html', api_key=app.config['GOOGLE_MAPS_API_KEY']) 